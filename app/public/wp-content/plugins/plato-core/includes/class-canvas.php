<?php
/**
 * Plato_Canvas
 *
 * Canvas LMS API client. Handles token storage (encrypted),
 * API calls with pagination, and sync orchestration.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Plato_Canvas {

    const CANVAS_BASE_URL     = 'https://mylearn.torrens.edu.au/api/v1';
    const TOKEN_META_KEY      = 'plato_canvas_token';
    const TOKEN_HINT_META_KEY = 'plato_canvas_token_hint';
    const LAST_SYNC_META_KEY  = 'plato_canvas_last_sync';
    const SYNC_STATUS_META_KEY = 'plato_canvas_sync_status';
    const SYNC_ERROR_META_KEY = 'plato_canvas_sync_error';

    private int $user_id;

    public function __construct( int $user_id ) {
        $this->user_id = $user_id;
    }

    // ─── Token Management ────────────────────────────────────────────────────

    public function save_token( string $token ): bool {
        $encrypted = plato_encrypt( $token );
        $hint      = substr( $token, -6 );

        update_user_meta( $this->user_id, self::TOKEN_META_KEY, $encrypted );
        update_user_meta( $this->user_id, self::TOKEN_HINT_META_KEY, $hint );
        update_user_meta( $this->user_id, self::SYNC_STATUS_META_KEY, 'never' );

        return true;
    }

    public function get_token(): string|false {
        $encrypted = get_user_meta( $this->user_id, self::TOKEN_META_KEY, true );
        if ( empty( $encrypted ) ) {
            return false;
        }
        return plato_decrypt( $encrypted );
    }

    public function has_token(): bool {
        return ! empty( get_user_meta( $this->user_id, self::TOKEN_META_KEY, true ) );
    }

    public function get_sync_status(): array {
        return array(
            'status'    => get_user_meta( $this->user_id, self::SYNC_STATUS_META_KEY, true ) ?: 'never',
            'last_sync' => get_user_meta( $this->user_id, self::LAST_SYNC_META_KEY, true ) ?: null,
            'error'     => get_user_meta( $this->user_id, self::SYNC_ERROR_META_KEY, true ) ?: null,
        );
    }

    /**
     * Quick token verification — hits /users/self (fast, single request).
     */
    public function verify_token( string $token ): true|WP_Error {
        $response = $this->make_request( $token, self::CANVAS_BASE_URL . '/users/self' );
        if ( is_wp_error( $response ) ) {
            return $response;
        }
        return true;
    }

    // ─── Sync Orchestration ──────────────────────────────────────────────────

    /**
     * Full sync: fetch courses from Canvas, then assignments for each course.
     *
     * @return array|WP_Error Sync summary on success, WP_Error on failure.
     */
    public function sync_all(): array|WP_Error {
        $token = $this->get_token();
        if ( ! $token ) {
            return new WP_Error( 'plato_no_canvas_token', 'No Canvas token stored.', array( 'status' => 400 ) );
        }

        update_user_meta( $this->user_id, self::SYNC_STATUS_META_KEY, 'syncing' );
        update_user_meta( $this->user_id, self::SYNC_ERROR_META_KEY, '' );

        // Fetch courses.
        $courses = $this->fetch_courses( $token );
        if ( is_wp_error( $courses ) ) {
            update_user_meta( $this->user_id, self::SYNC_STATUS_META_KEY, 'error' );
            update_user_meta( $this->user_id, self::SYNC_ERROR_META_KEY, $courses->get_error_message() );
            return $courses;
        }

        $courses_synced     = 0;
        $assignments_synced = 0;

        foreach ( $courses as $canvas_course ) {
            $course_data = $this->map_course( $canvas_course );
            $plato_course_id = Plato_Database::insert_course( $course_data );

            if ( $plato_course_id === false ) {
                continue;
            }

            $courses_synced++;

            // Fetch assignments for this course.
            $assignments = $this->fetch_assignments( $token, $canvas_course['id'] );
            if ( is_wp_error( $assignments ) ) {
                continue; // Skip this course's assignments but don't fail the whole sync.
            }

            foreach ( $assignments as $canvas_assignment ) {
                $assignment_data = $this->map_assignment( $canvas_assignment, $plato_course_id );
                $result = Plato_Database::insert_assignment( $assignment_data );
                if ( $result !== false ) {
                    $assignments_synced++;
                }
            }
        }

        $synced_at = current_time( 'mysql', true );
        update_user_meta( $this->user_id, self::SYNC_STATUS_META_KEY, 'ok' );
        update_user_meta( $this->user_id, self::LAST_SYNC_META_KEY, $synced_at );

        return array(
            'courses_synced'     => $courses_synced,
            'assignments_synced' => $assignments_synced,
            'synced_at'          => $synced_at,
        );
    }

    // ─── Canvas API Calls ────────────────────────────────────────────────────

    private function fetch_courses( string $token ): array|WP_Error {
        return $this->fetch_all_pages(
            $token,
            '/courses',
            array(
                'enrollment_type' => 'student',
                'state[]'         => 'available',
                'per_page'        => 100,
            )
        );
    }

    private function fetch_assignments( string $token, int $canvas_course_id ): array|WP_Error {
        return $this->fetch_all_pages(
            $token,
            "/courses/$canvas_course_id/assignments",
            array( 'per_page' => 100 )
        );
    }

    /**
     * Fetch all pages from a Canvas API endpoint, following Link header pagination.
     */
    private function fetch_all_pages( string $token, string $endpoint, array $params = array() ): array|WP_Error {
        $url     = self::CANVAS_BASE_URL . $endpoint . '?' . http_build_query( $params );
        $results = array();

        while ( $url ) {
            $response = $this->make_request( $token, $url );
            if ( is_wp_error( $response ) ) {
                return $response;
            }

            $body = json_decode( wp_remote_retrieve_body( $response ), true );
            if ( ! is_array( $body ) ) {
                return new WP_Error( 'plato_canvas_parse_error', 'Failed to parse Canvas response.' );
            }

            $results = array_merge( $results, $body );

            // Check for next page in Link header.
            $url = $this->get_next_page_url( wp_remote_retrieve_header( $response, 'link' ) );
        }

        return $results;
    }

    /**
     * Make a single HTTP request to the Canvas API.
     */
    private function make_request( string $token, string $url ): array|WP_Error {
        $response = wp_remote_get( $url, array(
            'headers' => array(
                'Authorization' => 'Bearer ' . $token,
                'Accept'        => 'application/json',
            ),
            'timeout' => 30,
        ) );

        if ( is_wp_error( $response ) ) {
            return new WP_Error( 'plato_canvas_request_failed', $response->get_error_message() );
        }

        $status = wp_remote_retrieve_response_code( $response );
        if ( $status >= 400 ) {
            $body = wp_remote_retrieve_body( $response );
            return new WP_Error(
                'plato_canvas_api_error',
                "Canvas API returned $status: $body",
                array( 'status' => $status )
            );
        }

        return $response;
    }

    /**
     * Parse the Link header to find the next page URL.
     */
    private function get_next_page_url( string $link_header ): string|null {
        if ( empty( $link_header ) ) {
            return null;
        }

        // Link header format: <url>; rel="next", <url>; rel="prev", ...
        if ( preg_match( '/<([^>]+)>;\s*rel="next"/', $link_header, $matches ) ) {
            return $matches[1];
        }

        return null;
    }

    // ─── Field Mapping ───────────────────────────────────────────────────────

    private function map_course( array $c ): array {
        return array(
            'user_id'          => $this->user_id,
            'canvas_course_id' => (int) $c['id'],
            'name'             => sanitize_text_field( $c['name'] ?? '' ),
            'course_code'      => sanitize_text_field( $c['course_code'] ?? '' ),
            'workflow_state'   => sanitize_text_field( $c['workflow_state'] ?? 'available' ),
            'start_at'         => $this->canvas_date_to_mysql( $c['start_at'] ?? null ),
            'end_at'           => $this->canvas_date_to_mysql( $c['end_at'] ?? null ),
            'synced_at'        => current_time( 'mysql', true ),
        );
    }

    private function map_assignment( array $a, int $plato_course_id ): array {
        $submission_types = '';
        if ( ! empty( $a['submission_types'] ) && is_array( $a['submission_types'] ) ) {
            $submission_types = implode( ',', $a['submission_types'] );
        }

        return array(
            'user_id'              => $this->user_id,
            'canvas_assignment_id' => (int) $a['id'],
            'canvas_course_id'     => (int) $a['course_id'],
            'plato_course_id'      => $plato_course_id,
            'name'                 => sanitize_text_field( $a['name'] ?? '' ),
            'description'          => wp_kses_post( $a['description'] ?? '' ),
            'due_at'               => $this->canvas_date_to_mysql( $a['due_at'] ?? null ),
            'points_possible'      => isset( $a['points_possible'] ) ? (float) $a['points_possible'] : null,
            'submission_types'     => sanitize_text_field( $submission_types ),
            'workflow_state'       => sanitize_text_field( $a['workflow_state'] ?? 'published' ),
            'synced_at'            => current_time( 'mysql', true ),
        );
    }

    /**
     * Convert Canvas ISO-8601 date to MySQL DATETIME format.
     */
    private function canvas_date_to_mysql( ?string $iso_date ): ?string {
        if ( empty( $iso_date ) ) {
            return null;
        }
        $timestamp = strtotime( $iso_date );
        return $timestamp ? gmdate( 'Y-m-d H:i:s', $timestamp ) : null;
    }

    // ─── Content Sync (P3+: Auto-ingest Canvas pages) ─────────────────────

    /**
     * Sync course content: fetch modules → items → pages → inject as study notes.
     *
     * @return array|WP_Error { pages_synced: int, pages_skipped: int }
     */
    public function sync_content(): array|WP_Error {
        $token = $this->get_token();
        if ( ! $token ) {
            return new WP_Error( 'plato_no_canvas_token', 'No Canvas token stored.', array( 'status' => 400 ) );
        }

        // Get user's courses from our DB.
        $courses = Plato_Database::get_courses_for_user( $this->user_id );
        if ( empty( $courses ) ) {
            return new WP_Error( 'plato_no_courses', 'No courses synced yet. Run Canvas sync first.', array( 'status' => 400 ) );
        }

        $pages_synced  = 0;
        $pages_skipped = 0;

        foreach ( $courses as $course ) {
            $canvas_course_id = (int) $course->canvas_course_id;
            $plato_course_id  = (int) $course->id;

            // Fetch modules for this course.
            $modules = $this->fetch_modules( $token, $canvas_course_id );
            if ( is_wp_error( $modules ) ) {
                continue; // Skip course on error, don't fail entire sync.
            }

            foreach ( $modules as $module ) {
                $module_name = $module['name'] ?? 'Unknown Module';

                // Fetch items in this module.
                $items = $this->fetch_module_items( $token, $canvas_course_id, (int) $module['id'] );
                if ( is_wp_error( $items ) ) {
                    continue;
                }

                foreach ( $items as $item ) {
                    // Only process Page items (most common content type).
                    if ( ( $item['type'] ?? '' ) !== 'Page' ) {
                        continue;
                    }

                    $page_url = $item['page_url'] ?? '';
                    if ( empty( $page_url ) ) {
                        continue;
                    }

                    // Check if we already synced this page.
                    $content_key = "page:{$canvas_course_id}:{$page_url}";
                    if ( Plato_Database::canvas_content_exists( $this->user_id, $content_key ) ) {
                        $pages_skipped++;
                        continue;
                    }

                    // Fetch the page body.
                    $page = $this->fetch_page_content( $token, $canvas_course_id, $page_url );
                    if ( is_wp_error( $page ) ) {
                        continue;
                    }

                    $html  = $page['body'] ?? '';
                    $title = $page['title'] ?? $item['title'] ?? 'Untitled';

                    // Strip HTML to plain text.
                    $text = self::strip_html_to_text( $html );
                    if ( mb_strlen( $text ) < 50 ) {
                        $pages_skipped++;
                        continue; // Skip near-empty pages.
                    }

                    // Build a file_name for the study note.
                    $file_name = "canvas-{$module_name}-{$title}";
                    $file_name = sanitize_file_name( $file_name );

                    // Chunk the text and insert as study notes.
                    $chunks       = Plato_Document_Processor::chunk_text( $text );
                    $total_chunks = count( $chunks );

                    foreach ( $chunks as $i => $chunk ) {
                        Plato_Database::insert_study_note( array(
                            'user_id'      => $this->user_id,
                            'course_id'    => $plato_course_id,
                            'file_name'    => $file_name,
                            'file_path'    => '', // No physical file for Canvas pages.
                            'file_type'    => 'canvas',
                            'file_size'    => mb_strlen( $text ),
                            'chunk_index'  => $i,
                            'total_chunks' => $total_chunks,
                            'content'      => $chunk,
                            'status'       => 'pending',
                        ) );
                    }

                    // Record that we synced this content.
                    Plato_Database::insert_canvas_content( array(
                        'user_id'           => $this->user_id,
                        'canvas_course_id'  => $canvas_course_id,
                        'plato_course_id'   => $plato_course_id,
                        'content_key'       => $content_key,
                        'content_type'      => 'page',
                        'title'             => mb_substr( $title, 0, 255 ),
                        'module_name'       => mb_substr( $module_name, 0, 255 ),
                        'chunks_created'    => $total_chunks,
                    ) );

                    $pages_synced++;
                }
            }
        }

        // If we created new chunks, schedule background summarization.
        if ( $pages_synced > 0 ) {
            wp_schedule_single_event( time() + 5, 'plato_process_documents' );
        }

        // Update content sync timestamp.
        update_user_meta( $this->user_id, 'plato_content_last_sync', current_time( 'mysql', true ) );

        return array(
            'pages_synced'  => $pages_synced,
            'pages_skipped' => $pages_skipped,
        );
    }

    // ─── Canvas Content API Calls ─────────────────────────────────────────

    private function fetch_modules( string $token, int $canvas_course_id ): array|WP_Error {
        return $this->fetch_all_pages(
            $token,
            "/courses/$canvas_course_id/modules",
            array( 'per_page' => 50 )
        );
    }

    private function fetch_module_items( string $token, int $canvas_course_id, int $module_id ): array|WP_Error {
        return $this->fetch_all_pages(
            $token,
            "/courses/$canvas_course_id/modules/$module_id/items",
            array( 'per_page' => 50 )
        );
    }

    private function fetch_page_content( string $token, int $canvas_course_id, string $page_url ): array|WP_Error {
        $url      = self::CANVAS_BASE_URL . "/courses/$canvas_course_id/pages/" . urlencode( $page_url );
        $response = $this->make_request( $token, $url );

        if ( is_wp_error( $response ) ) {
            return $response;
        }

        $body = json_decode( wp_remote_retrieve_body( $response ), true );
        if ( ! is_array( $body ) ) {
            return new WP_Error( 'plato_canvas_parse_error', 'Failed to parse page response.' );
        }

        return $body;
    }

    // ─── HTML Stripping ───────────────────────────────────────────────────

    /**
     * Convert HTML to clean plain text suitable for LLM processing.
     */
    public static function strip_html_to_text( string $html ): string {
        // Remove script and style tags completely.
        $html = preg_replace( '/<script[^>]*>.*?<\/script>/is', '', $html );
        $html = preg_replace( '/<style[^>]*>.*?<\/style>/is', '', $html );
        $html = preg_replace( '/<link[^>]*>/is', '', $html );

        // Convert headings to text with markers.
        $html = preg_replace( '/<h[1-6][^>]*>(.*?)<\/h[1-6]>/is', "\n## $1\n", $html );

        // Convert list items.
        $html = preg_replace( '/<li[^>]*>/i', "\n- ", $html );

        // Convert paragraph and div breaks.
        $html = preg_replace( '/<\/(p|div|tr)>/i', "\n", $html );
        $html = preg_replace( '/<br\s*\/?>/i', "\n", $html );

        // Strip all remaining tags.
        $text = wp_strip_all_tags( $html );

        // Decode HTML entities.
        $text = html_entity_decode( $text, ENT_QUOTES, 'UTF-8' );

        // Clean up whitespace: collapse multiple blank lines.
        $text = preg_replace( '/\n{3,}/', "\n\n", $text );
        $text = preg_replace( '/[ \t]+/', ' ', $text );

        return trim( $text );
    }
}
