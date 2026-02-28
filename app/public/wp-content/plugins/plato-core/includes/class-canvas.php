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

    // ─── Content Sync (P3+: Auto-ingest Canvas content) ────────────────────

    /**
     * Sync course content: fetch modules → items → dispatch by type.
     *
     * @return array|WP_Error Sync summary with counts per content type.
     */
    public function sync_content(): array|WP_Error {
        $token = $this->get_token();
        if ( ! $token ) {
            return new WP_Error( 'plato_no_canvas_token', 'No Canvas token stored.', array( 'status' => 400 ) );
        }

        $courses = Plato_Database::get_courses_for_user( $this->user_id );
        if ( empty( $courses ) ) {
            return new WP_Error( 'plato_no_courses', 'No courses synced yet. Run Canvas sync first.', array( 'status' => 400 ) );
        }

        $counts = array(
            'pages_synced'       => 0,
            'pages_skipped'      => 0,
            'discussions_synced' => 0,
            'assignments_synced' => 0,
            'external_links'     => 0,
            'modules_tracked'    => 0,
        );

        foreach ( $courses as $course ) {
            $canvas_course_id = (int) $course->canvas_course_id;
            $plato_course_id  = (int) $course->id;

            $modules = $this->fetch_modules( $token, $canvas_course_id );
            if ( is_wp_error( $modules ) ) {
                continue;
            }

            foreach ( $modules as $module ) {
                $module_name = $module['name'] ?? 'Unknown Module';

                $items = $this->fetch_module_items( $token, $canvas_course_id, (int) $module['id'] );
                if ( is_wp_error( $items ) ) {
                    continue;
                }

                foreach ( $items as $item ) {
                    $type = $item['type'] ?? '';

                    switch ( $type ) {
                        case 'Page':
                            $result = $this->sync_page_item( $token, $item, $canvas_course_id, $plato_course_id, $module_name );
                            if ( $result === 'synced' ) {
                                $counts['pages_synced']++;
                            } elseif ( $result === 'skipped' ) {
                                $counts['pages_skipped']++;
                            }
                            break;

                        case 'Discussion':
                            $result = $this->sync_discussion_item( $token, $item, $canvas_course_id, $plato_course_id, $module_name );
                            if ( $result ) {
                                $counts['discussions_synced']++;
                            }
                            break;

                        case 'Assignment':
                            $result = $this->sync_assignment_content( $token, $item, $canvas_course_id, $plato_course_id, $module_name );
                            if ( $result ) {
                                $counts['assignments_synced']++;
                            }
                            break;

                        case 'ExternalUrl':
                            $result = $this->sync_external_link( $item, $canvas_course_id, $plato_course_id, $module_name );
                            if ( $result ) {
                                $counts['external_links']++;
                            }
                            break;
                    }
                }
            }

            // Sync module completion progress for this course.
            $progress_count = $this->sync_module_progress( $token, $canvas_course_id, $plato_course_id, $modules );
            $counts['modules_tracked'] += $progress_count;
        }

        // Schedule background summarization if new chunks were created.
        if ( $counts['pages_synced'] > 0 || $counts['discussions_synced'] > 0 || $counts['assignments_synced'] > 0 ) {
            wp_schedule_single_event( time() + 5, 'plato_process_documents' );
        }

        update_user_meta( $this->user_id, 'plato_content_last_sync', current_time( 'mysql', true ) );

        return $counts;
    }

    // ─── Content Type Sync Methods ───────────────────────────────────────

    /**
     * Sync a Page item: fetch HTML, store rich content + plain text chunks.
     *
     * @return string 'synced', 'skipped', or 'error'
     */
    private function sync_page_item( string $token, array $item, int $canvas_course_id, int $plato_course_id, string $module_name ): string {
        $page_url = $item['page_url'] ?? '';
        if ( empty( $page_url ) ) {
            return 'skipped';
        }

        $content_key = "page:{$canvas_course_id}:{$page_url}";
        if ( Plato_Database::canvas_content_exists( $this->user_id, $content_key ) ) {
            return 'skipped';
        }

        $page = $this->fetch_page_content( $token, $canvas_course_id, $page_url );
        if ( is_wp_error( $page ) ) {
            return 'error';
        }

        $html  = $page['body'] ?? '';
        $title = $page['title'] ?? $item['title'] ?? 'Untitled';

        $text = self::strip_html_to_text( $html );
        if ( mb_strlen( $text ) < 50 ) {
            return 'skipped';
        }

        // Extract embedded resources from HTML.
        $resources = $this->extract_embedded_resources( $html );

        $file_name = sanitize_file_name( "canvas-{$module_name}-{$title}" );

        $chunks       = Plato_Document_Processor::chunk_text( $text );
        $total_chunks = count( $chunks );

        foreach ( $chunks as $i => $chunk ) {
            Plato_Database::insert_study_note( array(
                'user_id'      => $this->user_id,
                'course_id'    => $plato_course_id,
                'file_name'    => $file_name,
                'file_path'    => '',
                'file_type'    => 'canvas',
                'file_size'    => mb_strlen( $text ),
                'chunk_index'  => $i,
                'total_chunks' => $total_chunks,
                'content'      => $chunk,
                'status'       => 'pending',
            ) );
        }

        Plato_Database::insert_canvas_content( array(
            'user_id'            => $this->user_id,
            'canvas_course_id'   => $canvas_course_id,
            'plato_course_id'    => $plato_course_id,
            'content_key'        => $content_key,
            'content_type'       => 'page',
            'title'              => mb_substr( $title, 0, 255 ),
            'module_name'        => mb_substr( $module_name, 0, 255 ),
            'chunks_created'     => $total_chunks,
            'html_content'       => $html,
            'embedded_resources' => ! empty( $resources ) ? wp_json_encode( $resources ) : null,
        ) );

        return 'synced';
    }

    /**
     * Sync a Discussion item: fetch topic + entries, store in discussions table + study notes.
     */
    private function sync_discussion_item( string $token, array $item, int $canvas_course_id, int $plato_course_id, string $module_name ): bool {
        $topic_id = $item['content_id'] ?? 0;
        if ( ! $topic_id ) {
            return false;
        }

        $content_key = "discussion:{$canvas_course_id}:{$topic_id}";
        if ( Plato_Database::canvas_content_exists( $this->user_id, $content_key ) ) {
            return false;
        }

        // Fetch discussion topic.
        $topic = $this->fetch_discussion_topic( $token, $canvas_course_id, $topic_id );
        if ( is_wp_error( $topic ) ) {
            return false;
        }

        $title        = $topic['title'] ?? $item['title'] ?? 'Untitled Discussion';
        $message_html = $topic['message'] ?? '';
        $message_text = self::strip_html_to_text( $message_html );

        // Fetch entries (student posts).
        $entries = $this->fetch_discussion_entries( $token, $canvas_course_id, $topic_id );
        $posts   = array();
        if ( ! is_wp_error( $entries ) && is_array( $entries ) ) {
            foreach ( $entries as $entry ) {
                $posts[] = array(
                    'user_name'  => $entry['user_name'] ?? 'Anonymous',
                    'message'    => self::strip_html_to_text( $entry['message'] ?? '' ),
                    'created_at' => $entry['created_at'] ?? null,
                );
            }
        }

        // Store in discussions table.
        Plato_Database::insert_canvas_discussion( array(
            'user_id'          => $this->user_id,
            'canvas_course_id' => $canvas_course_id,
            'plato_course_id'  => $plato_course_id,
            'canvas_topic_id'  => $topic_id,
            'module_name'      => mb_substr( $module_name, 0, 255 ),
            'title'            => mb_substr( $title, 0, 255 ),
            'message'          => $message_html,
            'message_plain'    => $message_text,
            'posts_json'       => wp_json_encode( $posts ),
            'post_count'       => count( $posts ),
            'synced_at'        => current_time( 'mysql', true ),
        ) );

        // Create study note chunks from discussion content (for LLM context).
        $discussion_text = "## Discussion: {$title}\n\n{$message_text}";
        foreach ( $posts as $post ) {
            $discussion_text .= "\n\n**{$post['user_name']}**: {$post['message']}";
        }

        if ( mb_strlen( $discussion_text ) >= 50 ) {
            $file_name    = sanitize_file_name( "canvas-{$module_name}-discussion-{$title}" );
            $chunks       = Plato_Document_Processor::chunk_text( $discussion_text );
            $total_chunks = count( $chunks );

            foreach ( $chunks as $i => $chunk ) {
                Plato_Database::insert_study_note( array(
                    'user_id'      => $this->user_id,
                    'course_id'    => $plato_course_id,
                    'file_name'    => $file_name,
                    'file_path'    => '',
                    'file_type'    => 'canvas',
                    'file_size'    => mb_strlen( $discussion_text ),
                    'chunk_index'  => $i,
                    'total_chunks' => $total_chunks,
                    'content'      => $chunk,
                    'status'       => 'pending',
                ) );
            }
        }

        // Track in canvas_content table.
        Plato_Database::insert_canvas_content( array(
            'user_id'          => $this->user_id,
            'canvas_course_id' => $canvas_course_id,
            'plato_course_id'  => $plato_course_id,
            'content_key'      => $content_key,
            'content_type'     => 'discussion',
            'title'            => mb_substr( $title, 0, 255 ),
            'module_name'      => mb_substr( $module_name, 0, 255 ),
            'chunks_created'   => isset( $total_chunks ) ? $total_chunks : 0,
        ) );

        return true;
    }

    /**
     * Sync an Assignment item: ingest description as study notes for LLM context.
     */
    private function sync_assignment_content( string $token, array $item, int $canvas_course_id, int $plato_course_id, string $module_name ): bool {
        $assignment_id = $item['content_id'] ?? 0;
        if ( ! $assignment_id ) {
            return false;
        }

        $content_key = "assignment:{$canvas_course_id}:{$assignment_id}";
        if ( Plato_Database::canvas_content_exists( $this->user_id, $content_key ) ) {
            return false;
        }

        // Look up the assignment already synced via sync_all().
        $assignment = Plato_Database::get_assignment_by_canvas_id( $this->user_id, $assignment_id );
        if ( ! $assignment || empty( $assignment->description ) ) {
            return false;
        }

        $title = $assignment->name ?? $item['title'] ?? 'Untitled Assignment';
        $text  = self::strip_html_to_text( $assignment->description );
        if ( mb_strlen( $text ) < 50 ) {
            return false;
        }

        $file_name    = sanitize_file_name( "canvas-{$module_name}-assignment-{$title}" );
        $chunks       = Plato_Document_Processor::chunk_text( $text );
        $total_chunks = count( $chunks );

        foreach ( $chunks as $i => $chunk ) {
            Plato_Database::insert_study_note( array(
                'user_id'      => $this->user_id,
                'course_id'    => $plato_course_id,
                'file_name'    => $file_name,
                'file_path'    => '',
                'file_type'    => 'canvas',
                'file_size'    => mb_strlen( $text ),
                'chunk_index'  => $i,
                'total_chunks' => $total_chunks,
                'content'      => $chunk,
                'status'       => 'pending',
            ) );
        }

        Plato_Database::insert_canvas_content( array(
            'user_id'          => $this->user_id,
            'canvas_course_id' => $canvas_course_id,
            'plato_course_id'  => $plato_course_id,
            'content_key'      => $content_key,
            'content_type'     => 'assignment',
            'title'            => mb_substr( $title, 0, 255 ),
            'module_name'      => mb_substr( $module_name, 0, 255 ),
            'chunks_created'   => $total_chunks,
        ) );

        return true;
    }

    /**
     * Sync an ExternalUrl item: store title + URL as a canvas_content record.
     */
    private function sync_external_link( array $item, int $canvas_course_id, int $plato_course_id, string $module_name ): bool {
        $url   = $item['external_url'] ?? '';
        $title = $item['title'] ?? 'External Link';

        if ( empty( $url ) ) {
            return false;
        }

        $content_key = "external:{$canvas_course_id}:" . md5( $url );
        if ( Plato_Database::canvas_content_exists( $this->user_id, $content_key ) ) {
            return false;
        }

        $resources = array( array(
            'type' => 'link',
            'url'  => $url,
        ) );

        Plato_Database::insert_canvas_content( array(
            'user_id'            => $this->user_id,
            'canvas_course_id'   => $canvas_course_id,
            'plato_course_id'    => $plato_course_id,
            'content_key'        => $content_key,
            'content_type'       => 'external_link',
            'title'              => mb_substr( $title, 0, 255 ),
            'module_name'        => mb_substr( $module_name, 0, 255 ),
            'chunks_created'     => 0,
            'embedded_resources' => wp_json_encode( $resources ),
        ) );

        return true;
    }

    /**
     * Sync module completion progress using module data already fetched.
     */
    private function sync_module_progress( string $token, int $canvas_course_id, int $plato_course_id, array $modules ): int {
        $count = 0;

        foreach ( $modules as $module ) {
            $module_id    = (int) ( $module['id'] ?? 0 );
            $module_name  = $module['name'] ?? 'Unknown Module';
            $module_state = $module['state'] ?? '';
            $completed_at = $this->canvas_date_to_mysql( $module['completed_at'] ?? null );
            $items_count  = (int) ( $module['items_count'] ?? 0 );

            // Count completed items from items_url if available.
            $items_completed = 0;
            if ( isset( $module['items'] ) && is_array( $module['items'] ) ) {
                foreach ( $module['items'] as $mi ) {
                    if ( ! empty( $mi['completion_requirement']['completed'] ) ) {
                        $items_completed++;
                    }
                }
            }

            Plato_Database::upsert_module_progress( array(
                'user_id'          => $this->user_id,
                'canvas_course_id' => $canvas_course_id,
                'plato_course_id'  => $plato_course_id,
                'canvas_module_id' => $module_id,
                'module_name'      => mb_substr( $module_name, 0, 255 ),
                'module_state'     => $module_state,
                'completed_at'     => $completed_at,
                'items_total'      => $items_count,
                'items_completed'  => $items_completed,
                'synced_at'        => current_time( 'mysql', true ),
            ) );
            $count++;
        }

        return $count;
    }

    // ─── Embedded Resource Extraction ────────────────────────────────────

    /**
     * Parse HTML to extract embedded resources: YouTube, eBook links, external URLs.
     *
     * @return array Array of resource objects { type, id?, url }
     */
    private function extract_embedded_resources( string $html ): array {
        $resources = array();
        $seen_urls = array();

        // YouTube embeds: <iframe src="...youtube.com/embed/VIDEO_ID...">
        if ( preg_match_all( '/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/', $html, $matches ) ) {
            foreach ( $matches[1] as $video_id ) {
                if ( ! isset( $seen_urls[ $video_id ] ) ) {
                    $resources[]           = array( 'type' => 'youtube', 'id' => $video_id, 'url' => "https://www.youtube.com/watch?v={$video_id}" );
                    $seen_urls[ $video_id ] = true;
                }
            }
        }

        // YouTube watch links: youtube.com/watch?v=VIDEO_ID
        if ( preg_match_all( '/youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/', $html, $matches ) ) {
            foreach ( $matches[1] as $video_id ) {
                if ( ! isset( $seen_urls[ $video_id ] ) ) {
                    $resources[]           = array( 'type' => 'youtube', 'id' => $video_id, 'url' => "https://www.youtube.com/watch?v={$video_id}" );
                    $seen_urls[ $video_id ] = true;
                }
            }
        }

        // youtu.be short links: youtu.be/VIDEO_ID
        if ( preg_match_all( '/youtu\.be\/([a-zA-Z0-9_-]{11})/', $html, $matches ) ) {
            foreach ( $matches[1] as $video_id ) {
                if ( ! isset( $seen_urls[ $video_id ] ) ) {
                    $resources[]           = array( 'type' => 'youtube', 'id' => $video_id, 'url' => "https://www.youtube.com/watch?v={$video_id}" );
                    $seen_urls[ $video_id ] = true;
                }
            }
        }

        // ProQuest/eBook links.
        if ( preg_match_all( '/href=["\']([^"\']*(?:proquest|ebookcentral|ebrary)[^"\']*)["\']/', $html, $matches ) ) {
            foreach ( $matches[1] as $url ) {
                if ( ! isset( $seen_urls[ $url ] ) ) {
                    $resources[]      = array( 'type' => 'ebook', 'url' => $url );
                    $seen_urls[ $url ] = true;
                }
            }
        }

        // External article URLs (exclude Canvas internal links).
        if ( preg_match_all( '/href=["\']((https?:\/\/)[^"\']+)["\']/', $html, $matches ) ) {
            foreach ( $matches[1] as $url ) {
                if ( isset( $seen_urls[ $url ] ) ) {
                    continue;
                }
                // Skip Canvas internal links.
                if ( strpos( $url, 'instructure.com' ) !== false || strpos( $url, 'torrens.edu.au' ) !== false ) {
                    continue;
                }
                // Skip already-captured YouTube/eBook links.
                if ( strpos( $url, 'youtube.com' ) !== false || strpos( $url, 'youtu.be' ) !== false
                     || strpos( $url, 'proquest' ) !== false || strpos( $url, 'ebookcentral' ) !== false ) {
                    continue;
                }
                $resources[]      = array( 'type' => 'link', 'url' => $url );
                $seen_urls[ $url ] = true;
            }
        }

        return $resources;
    }

    // ─── Canvas Content API Calls ─────────────────────────────────────────

    private function fetch_modules( string $token, int $canvas_course_id ): array|WP_Error {
        return $this->fetch_all_pages(
            $token,
            "/courses/$canvas_course_id/modules",
            array(
                'per_page'  => 50,
                'include[]' => 'items',
            )
        );
    }

    private function fetch_module_items( string $token, int $canvas_course_id, int $module_id ): array|WP_Error {
        return $this->fetch_all_pages(
            $token,
            "/courses/$canvas_course_id/modules/$module_id/items",
            array( 'per_page' => 50 )
        );
    }

    private function fetch_discussion_topic( string $token, int $canvas_course_id, int $topic_id ): array|WP_Error {
        $url      = self::CANVAS_BASE_URL . "/courses/$canvas_course_id/discussion_topics/$topic_id";
        $response = $this->make_request( $token, $url );

        if ( is_wp_error( $response ) ) {
            return $response;
        }

        $body = json_decode( wp_remote_retrieve_body( $response ), true );
        if ( ! is_array( $body ) ) {
            return new WP_Error( 'plato_canvas_parse_error', 'Failed to parse discussion topic response.' );
        }

        return $body;
    }

    private function fetch_discussion_entries( string $token, int $canvas_course_id, int $topic_id ): array|WP_Error {
        return $this->fetch_all_pages(
            $token,
            "/courses/$canvas_course_id/discussion_topics/$topic_id/entries",
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
