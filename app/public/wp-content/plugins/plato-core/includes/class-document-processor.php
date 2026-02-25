<?php
/**
 * Plato_Document_Processor
 *
 * Extracts text from PDF/PPTX, chunks it, and summarizes via LLM.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Plato_Document_Processor {

    const MAX_FILE_SIZE      = 20 * 1024 * 1024; // 20 MB
    const ALLOWED_EXTENSIONS = array( 'pdf', 'pptx' );
    const ALLOWED_MIMES      = array(
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    );
    const CHUNK_SIZE    = 3000; // characters (~750 tokens)
    const CHUNK_OVERLAP = 200;

    // ─── Validation ─────────────────────────────────────────────────────────

    public static function validate_file( array $file ): true|WP_Error {
        if ( empty( $file['tmp_name'] ) || ! is_uploaded_file( $file['tmp_name'] ) ) {
            return new WP_Error( 'plato_no_file', 'No file uploaded.', array( 'status' => 400 ) );
        }

        if ( $file['size'] > self::MAX_FILE_SIZE ) {
            return new WP_Error( 'plato_file_too_large', 'File must be under 20 MB.', array( 'status' => 400 ) );
        }

        $ext = strtolower( pathinfo( $file['name'], PATHINFO_EXTENSION ) );
        if ( ! in_array( $ext, self::ALLOWED_EXTENSIONS, true ) ) {
            return new WP_Error( 'plato_invalid_type', 'Only PDF and PPTX files are accepted.', array( 'status' => 400 ) );
        }

        return true;
    }

    // ─── File Storage ───────────────────────────────────────────────────────

    public static function store_file( array $file, int $user_id ): string|WP_Error {
        $upload_dir = wp_upload_dir();
        $plato_dir  = $upload_dir['basedir'] . '/plato/' . $user_id;

        if ( ! wp_mkdir_p( $plato_dir ) ) {
            return new WP_Error( 'plato_dir_failed', 'Could not create upload directory.', array( 'status' => 500 ) );
        }

        $safe_name = sanitize_file_name( $file['name'] );
        $dest_name = time() . '-' . $safe_name;
        $dest_path = $plato_dir . '/' . $dest_name;

        if ( ! move_uploaded_file( $file['tmp_name'], $dest_path ) ) {
            return new WP_Error( 'plato_move_failed', 'Could not save uploaded file.', array( 'status' => 500 ) );
        }

        // Return relative path from uploads dir.
        return 'plato/' . $user_id . '/' . $dest_name;
    }

    // ─── Text Extraction ────────────────────────────────────────────────────

    public static function extract_text( string $full_path, string $file_type ): string|WP_Error {
        if ( $file_type === 'pdf' ) {
            return self::extract_pdf( $full_path );
        }
        if ( $file_type === 'pptx' ) {
            return self::extract_pptx( $full_path );
        }
        return new WP_Error( 'plato_unsupported_type', "Unsupported file type: $file_type" );
    }

    private static function extract_pdf( string $path ): string|WP_Error {
        try {
            $parser = new \Smalot\PdfParser\Parser();
            $pdf    = $parser->parseFile( $path );
            $pages  = $pdf->getPages();
            $text   = '';

            foreach ( $pages as $i => $page ) {
                $page_text = $page->getText();
                if ( ! empty( trim( $page_text ) ) ) {
                    $text .= "--- Page " . ( $i + 1 ) . " ---\n" . $page_text . "\n\n";
                }
            }

            $text = trim( $text );
            if ( empty( $text ) ) {
                return new WP_Error( 'plato_no_text', 'Could not extract any text from this PDF. It may contain only images.' );
            }

            return $text;
        } catch ( \Exception $e ) {
            return new WP_Error( 'plato_pdf_error', 'PDF parsing failed: ' . $e->getMessage() );
        }
    }

    private static function extract_pptx( string $path ): string|WP_Error {
        try {
            $reader       = \PhpOffice\PhpPresentation\IOFactory::createReader( 'PowerPoint2007' );
            $presentation = $reader->load( $path );
            $text         = '';

            foreach ( $presentation->getAllSlides() as $i => $slide ) {
                $slide_text = '';

                foreach ( $slide->getShapeCollection() as $shape ) {
                    if ( $shape instanceof \PhpOffice\PhpPresentation\Shape\RichText ) {
                        foreach ( $shape->getParagraphs() as $paragraph ) {
                            $para_text = '';
                            foreach ( $paragraph->getRichTextElements() as $element ) {
                                if ( method_exists( $element, 'getText' ) ) {
                                    $para_text .= $element->getText();
                                }
                            }
                            if ( ! empty( trim( $para_text ) ) ) {
                                $slide_text .= $para_text . "\n";
                            }
                        }
                    } elseif ( $shape instanceof \PhpOffice\PhpPresentation\Shape\Table ) {
                        foreach ( $shape->getRows() as $row ) {
                            $row_text = array();
                            foreach ( $row->getCells() as $cell ) {
                                foreach ( $cell->getParagraphs() as $paragraph ) {
                                    $cell_text = '';
                                    foreach ( $paragraph->getRichTextElements() as $element ) {
                                        if ( method_exists( $element, 'getText' ) ) {
                                            $cell_text .= $element->getText();
                                        }
                                    }
                                    if ( ! empty( trim( $cell_text ) ) ) {
                                        $row_text[] = trim( $cell_text );
                                    }
                                }
                            }
                            if ( ! empty( $row_text ) ) {
                                $slide_text .= implode( ' | ', $row_text ) . "\n";
                            }
                        }
                    }
                }

                if ( ! empty( trim( $slide_text ) ) ) {
                    $text .= "--- Slide " . ( $i + 1 ) . " ---\n" . trim( $slide_text ) . "\n\n";
                }
            }

            $text = trim( $text );
            if ( empty( $text ) ) {
                return new WP_Error( 'plato_no_text', 'Could not extract any text from this PPTX. It may contain only images.' );
            }

            return $text;
        } catch ( \Exception $e ) {
            return new WP_Error( 'plato_pptx_error', 'PPTX parsing failed: ' . $e->getMessage() );
        }
    }

    // ─── Chunking ───────────────────────────────────────────────────────────

    public static function chunk_text( string $text ): array {
        $chunks    = array();
        $len       = mb_strlen( $text );
        $pos       = 0;

        while ( $pos < $len ) {
            $chunk = mb_substr( $text, $pos, self::CHUNK_SIZE );

            // Try to break at a paragraph or sentence boundary.
            if ( $pos + self::CHUNK_SIZE < $len ) {
                $last_para = mb_strrpos( $chunk, "\n\n" );
                if ( $last_para !== false && $last_para > self::CHUNK_SIZE * 0.5 ) {
                    $chunk = mb_substr( $chunk, 0, $last_para );
                } else {
                    $last_sentence = mb_strrpos( $chunk, '. ' );
                    if ( $last_sentence !== false && $last_sentence > self::CHUNK_SIZE * 0.5 ) {
                        $chunk = mb_substr( $chunk, 0, $last_sentence + 1 );
                    }
                }
            }

            $chunks[] = trim( $chunk );
            $pos     += mb_strlen( $chunk );

            // Add overlap for continuity.
            if ( $pos < $len ) {
                $pos = max( 0, $pos - self::CHUNK_OVERLAP );
            }
        }

        return array_filter( $chunks, fn( $c ) => ! empty( $c ) );
    }

    // ─── Full Processing Pipeline ───────────────────────────────────────────

    /**
     * Process a single pending study note chunk:
     * 1. If chunk_index=0 and content is null, extract text and create chunk rows.
     * 2. If content exists but summary is null, summarize the chunk.
     */
    public static function process_document( int $note_id ): bool|WP_Error {
        $note = Plato_Database::get_study_note( $note_id );
        if ( ! $note || $note->status !== 'pending' ) {
            return false;
        }

        // Mark as processing.
        Plato_Database::update_study_note( $note_id, array( 'status' => 'processing' ) );

        // Step 1: Extract and chunk (only for the initial row, chunk_index=0, no content yet).
        if ( (int) $note->chunk_index === 0 && empty( $note->content ) ) {
            $upload_dir = wp_upload_dir();
            $full_path  = $upload_dir['basedir'] . '/' . $note->file_path;

            if ( ! file_exists( $full_path ) ) {
                Plato_Database::update_study_note( $note_id, array(
                    'status'        => 'error',
                    'error_message' => 'File not found on disk.',
                ) );
                return new WP_Error( 'plato_file_missing', 'Uploaded file not found.' );
            }

            // Increase time limit for large files.
            set_time_limit( 300 );

            $text = self::extract_text( $full_path, $note->file_type );
            if ( is_wp_error( $text ) ) {
                Plato_Database::update_study_note( $note_id, array(
                    'status'        => 'error',
                    'error_message' => $text->get_error_message(),
                ) );
                return $text;
            }

            $chunks       = self::chunk_text( $text );
            $total_chunks = count( $chunks );

            // Update the first chunk (chunk_index=0).
            Plato_Database::update_study_note( $note_id, array(
                'content'      => $chunks[0],
                'total_chunks' => $total_chunks,
                'status'       => 'pending', // back to pending for summarization pass
            ) );

            // Create remaining chunk rows.
            for ( $i = 1; $i < $total_chunks; $i++ ) {
                Plato_Database::insert_study_note( array(
                    'user_id'      => $note->user_id,
                    'course_id'    => $note->course_id,
                    'file_name'    => $note->file_name,
                    'file_path'    => $note->file_path,
                    'file_type'    => $note->file_type,
                    'file_size'    => $note->file_size,
                    'chunk_index'  => $i,
                    'total_chunks' => $total_chunks,
                    'content'      => $chunks[ $i ],
                    'status'       => 'pending',
                ) );
            }

            return true; // Chunks created, summaries will happen on next cron pass.
        }

        // Step 2: Summarize a chunk that has content but no summary.
        if ( ! empty( $note->content ) && empty( $note->summary ) ) {
            // Get course name for context.
            global $wpdb;
            $course_name = $wpdb->get_var( $wpdb->prepare(
                "SELECT name FROM {$wpdb->prefix}plato_courses WHERE id = %d",
                $note->course_id
            ) ) ?? 'Unknown Course';

            $result = Plato_LLM::summarize( $note->content, $course_name );
            if ( is_wp_error( $result ) ) {
                Plato_Database::update_study_note( $note_id, array(
                    'status'        => 'error',
                    'error_message' => $result->get_error_message(),
                ) );
                return $result;
            }

            Plato_Database::update_study_note( $note_id, array(
                'summary'      => $result['content'],
                'status'       => 'completed',
                'processed_at' => current_time( 'mysql', true ),
            ) );

            return true;
        }

        // If we get here, something is wrong — mark as error.
        Plato_Database::update_study_note( $note_id, array(
            'status'        => 'error',
            'error_message' => 'Unexpected state: no content and not chunk_index 0.',
        ) );

        return false;
    }
}
