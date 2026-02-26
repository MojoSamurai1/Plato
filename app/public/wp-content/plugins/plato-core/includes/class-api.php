<?php
/**
 * Plato_API
 *
 * Registers all REST endpoints under the plato/v1 namespace.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Plato_API {

    const NAMESPACE = 'plato/v1';

    public function register_routes(): void {
        // ─── Auth ────────────────────────────────────────────────────────────
        register_rest_route( self::NAMESPACE, '/auth/login', array(
            'methods'             => 'POST',
            'callback'            => array( $this, 'login_handler' ),
            'permission_callback' => '__return_true',
        ) );

        register_rest_route( self::NAMESPACE, '/auth/me', array(
            'methods'             => 'GET',
            'callback'            => array( $this, 'me_handler' ),
            'permission_callback' => '__return_true',
        ) );

        // ─── Canvas ─────────────────────────────────────────────────────────
        register_rest_route( self::NAMESPACE, '/canvas/connect', array(
            'methods'             => 'POST',
            'callback'            => array( $this, 'canvas_connect_handler' ),
            'permission_callback' => '__return_true',
        ) );

        register_rest_route( self::NAMESPACE, '/canvas/sync', array(
            'methods'             => 'POST',
            'callback'            => array( $this, 'canvas_sync_handler' ),
            'permission_callback' => '__return_true',
        ) );

        register_rest_route( self::NAMESPACE, '/canvas/status', array(
            'methods'             => 'GET',
            'callback'            => array( $this, 'canvas_status_handler' ),
            'permission_callback' => '__return_true',
        ) );

        register_rest_route( self::NAMESPACE, '/canvas/content-sync', array(
            'methods'             => 'POST',
            'callback'            => array( $this, 'canvas_content_sync_handler' ),
            'permission_callback' => '__return_true',
        ) );

        // ─── Data ───────────────────────────────────────────────────────────
        register_rest_route( self::NAMESPACE, '/courses', array(
            'methods'             => 'GET',
            'callback'            => array( $this, 'get_courses_handler' ),
            'permission_callback' => '__return_true',
        ) );

        register_rest_route( self::NAMESPACE, '/assignments', array(
            'methods'             => 'GET',
            'callback'            => array( $this, 'get_assignments_handler' ),
            'permission_callback' => '__return_true',
        ) );

        register_rest_route( self::NAMESPACE, '/courses/(?P<id>\d+)/content', array(
            'methods'             => 'GET',
            'callback'            => array( $this, 'get_course_content_handler' ),
            'permission_callback' => '__return_true',
        ) );

        // ─── Chat (P2: Socratic Tutor) ─────────────────────────────────────
        register_rest_route( self::NAMESPACE, '/chat/conversations', array(
            'methods'             => 'GET',
            'callback'            => array( $this, 'get_conversations_handler' ),
            'permission_callback' => '__return_true',
        ) );

        register_rest_route( self::NAMESPACE, '/chat/conversations', array(
            'methods'             => 'POST',
            'callback'            => array( $this, 'create_conversation_handler' ),
            'permission_callback' => '__return_true',
        ) );

        register_rest_route( self::NAMESPACE, '/chat/conversations/(?P<id>\d+)', array(
            'methods'             => 'GET',
            'callback'            => array( $this, 'get_conversation_handler' ),
            'permission_callback' => '__return_true',
        ) );

        register_rest_route( self::NAMESPACE, '/chat/conversations/(?P<id>\d+)', array(
            'methods'             => 'DELETE',
            'callback'            => array( $this, 'delete_conversation_handler' ),
            'permission_callback' => '__return_true',
        ) );

        register_rest_route( self::NAMESPACE, '/chat/conversations/(?P<id>\d+)/messages', array(
            'methods'             => 'POST',
            'callback'            => array( $this, 'send_message_handler' ),
            'permission_callback' => '__return_true',
        ) );

        register_rest_route( self::NAMESPACE, '/chat/conversations/(?P<id>\d+)/stream', array(
            'methods'             => 'POST',
            'callback'            => array( $this, 'stream_message_handler' ),
            'permission_callback' => '__return_true',
        ) );

        // ─── Study Notes (P3: Document Ingestion) ─────────────────────────
        register_rest_route( self::NAMESPACE, '/notes/upload', array(
            'methods'             => 'POST',
            'callback'            => array( $this, 'upload_note_handler' ),
            'permission_callback' => '__return_true',
        ) );

        register_rest_route( self::NAMESPACE, '/notes', array(
            'methods'             => 'GET',
            'callback'            => array( $this, 'get_notes_handler' ),
            'permission_callback' => '__return_true',
        ) );

        register_rest_route( self::NAMESPACE, '/notes/delete', array(
            'methods'             => 'POST',
            'callback'            => array( $this, 'delete_note_handler' ),
            'permission_callback' => '__return_true',
        ) );

        // ─── Dashboard ──────────────────────────────────────────────────────
        register_rest_route( self::NAMESPACE, '/dashboard/stats', array(
            'methods'             => 'GET',
            'callback'            => array( $this, 'get_dashboard_stats_handler' ),
            'permission_callback' => '__return_true',
        ) );

        // ─── Training Zone ──────────────────────────────────────────────────
        register_rest_route( self::NAMESPACE, '/training/modules', array(
            'methods'             => 'GET',
            'callback'            => array( $this, 'get_training_modules_handler' ),
            'permission_callback' => '__return_true',
        ) );

        register_rest_route( self::NAMESPACE, '/training/generate/(?P<course_id>\d+)/(?P<module_name>[^/]+)', array(
            'methods'             => 'POST',
            'callback'            => array( $this, 'generate_training_handler' ),
            'permission_callback' => '__return_true',
        ) );

        register_rest_route( self::NAMESPACE, '/training/scenarios/(?P<course_id>\d+)/(?P<module_name>[^/]+)', array(
            'methods'             => 'GET',
            'callback'            => array( $this, 'get_training_scenarios_handler' ),
            'permission_callback' => '__return_true',
        ) );

        register_rest_route( self::NAMESPACE, '/training/submit', array(
            'methods'             => 'POST',
            'callback'            => array( $this, 'submit_training_handler' ),
            'permission_callback' => '__return_true',
        ) );

        register_rest_route( self::NAMESPACE, '/training/progress/(?P<course_id>\d+)', array(
            'methods'             => 'GET',
            'callback'            => array( $this, 'get_training_progress_handler' ),
            'permission_callback' => '__return_true',
        ) );

        // ─── Settings ──────────────────────────────────────────────────────
        register_rest_route( self::NAMESPACE, '/settings/llm', array(
            'methods'             => 'GET',
            'callback'            => array( $this, 'get_llm_settings_handler' ),
            'permission_callback' => '__return_true',
        ) );

        register_rest_route( self::NAMESPACE, '/settings/llm', array(
            'methods'             => 'POST',
            'callback'            => array( $this, 'save_llm_settings_handler' ),
            'permission_callback' => '__return_true',
        ) );
    }

    // ─── Auth Handlers ───────────────────────────────────────────────────────

    public function login_handler( WP_REST_Request $request ): WP_REST_Response|WP_Error {
        $username = sanitize_text_field( $request->get_param( 'username' ) );
        $password = $request->get_param( 'password' );

        if ( empty( $username ) || empty( $password ) ) {
            return new WP_Error(
                'plato_missing_credentials',
                'Username and password are required.',
                array( 'status' => 400 )
            );
        }

        $user = wp_authenticate( $username, $password );
        if ( is_wp_error( $user ) ) {
            return new WP_Error(
                'plato_invalid_credentials',
                'Invalid username or password.',
                array( 'status' => 401 )
            );
        }

        $token = Plato_Auth::generate_token( $user->ID );

        return new WP_REST_Response( array(
            'token'        => $token,
            'user_id'      => $user->ID,
            'display_name' => $user->display_name,
            'expires'      => time() + Plato_Auth::TOKEN_EXPIRY,
        ), 200 );
    }

    public function me_handler( WP_REST_Request $request ): WP_REST_Response|WP_Error {
        $user_id = $this->authenticate( $request );
        if ( is_wp_error( $user_id ) ) {
            return $user_id;
        }

        $user = get_user_by( 'id', $user_id );

        return new WP_REST_Response( array(
            'user_id'      => $user->ID,
            'display_name' => $user->display_name,
            'email'        => $user->user_email,
        ), 200 );
    }

    // ─── Canvas Handlers ─────────────────────────────────────────────────────

    public function canvas_connect_handler( WP_REST_Request $request ): WP_REST_Response|WP_Error {
        $user_id = $this->authenticate( $request );
        if ( is_wp_error( $user_id ) ) {
            return $user_id;
        }

        $canvas_token = $request->get_param( 'canvas_token' );
        if ( empty( $canvas_token ) ) {
            return new WP_Error(
                'plato_missing_token',
                'canvas_token is required.',
                array( 'status' => 400 )
            );
        }

        $canvas = new Plato_Canvas( $user_id );
        $canvas->save_token( $canvas_token );

        $result = $canvas->sync_all();
        if ( is_wp_error( $result ) ) {
            return new WP_REST_Response( array(
                'success' => false,
                'message' => 'Token saved but sync failed. Will retry in 6 hours.',
                'error'   => $result->get_error_message(),
            ), 200 );
        }

        return new WP_REST_Response( array(
            'success'            => true,
            'message'            => sprintf(
                'Canvas connected. %d courses and %d assignments synced.',
                $result['courses_synced'],
                $result['assignments_synced']
            ),
            'courses_synced'     => $result['courses_synced'],
            'assignments_synced' => $result['assignments_synced'],
            'synced_at'          => $result['synced_at'],
        ), 200 );
    }

    public function canvas_sync_handler( WP_REST_Request $request ): WP_REST_Response|WP_Error {
        $user_id = $this->authenticate( $request );
        if ( is_wp_error( $user_id ) ) {
            return $user_id;
        }

        $canvas = new Plato_Canvas( $user_id );
        if ( ! $canvas->has_token() ) {
            return new WP_Error(
                'plato_no_canvas_token',
                'No Canvas token stored. Connect Canvas first.',
                array( 'status' => 400 )
            );
        }

        $result = $canvas->sync_all();
        if ( is_wp_error( $result ) ) {
            return $result;
        }

        return new WP_REST_Response( array(
            'success'            => true,
            'courses_synced'     => $result['courses_synced'],
            'assignments_synced' => $result['assignments_synced'],
            'synced_at'          => $result['synced_at'],
        ), 200 );
    }

    public function canvas_status_handler( WP_REST_Request $request ): WP_REST_Response|WP_Error {
        $user_id = $this->authenticate( $request );
        if ( is_wp_error( $user_id ) ) {
            return $user_id;
        }

        $canvas = new Plato_Canvas( $user_id );

        $content_stats = Plato_Database::get_canvas_content_stats( $user_id );

        return new WP_REST_Response( array(
            'connected'    => $canvas->has_token(),
            'hint'         => get_user_meta( $user_id, Plato_Canvas::TOKEN_HINT_META_KEY, true ) ?: null,
            'sync'         => $canvas->get_sync_status(),
            'content_sync' => array(
                'pages_synced'    => $content_stats['pages_synced'],
                'total_chunks'    => $content_stats['total_chunks'],
                'last_sync'       => get_user_meta( $user_id, 'plato_content_last_sync', true ) ?: null,
            ),
        ), 200 );
    }

    public function canvas_content_sync_handler( WP_REST_Request $request ): WP_REST_Response|WP_Error {
        $user_id = $this->authenticate( $request );
        if ( is_wp_error( $user_id ) ) {
            return $user_id;
        }

        $canvas = new Plato_Canvas( $user_id );
        if ( ! $canvas->has_token() ) {
            return new WP_Error(
                'plato_no_canvas_token',
                'No Canvas token stored. Connect Canvas first.',
                array( 'status' => 400 )
            );
        }

        // Increase time limit — content sync fetches many pages.
        set_time_limit( 300 );

        $result = $canvas->sync_content();
        if ( is_wp_error( $result ) ) {
            return $result;
        }

        $stats = Plato_Database::get_canvas_content_stats( $user_id );

        return new WP_REST_Response( array(
            'success'        => true,
            'pages_synced'   => $result['pages_synced'],
            'pages_skipped'  => $result['pages_skipped'],
            'total_pages'    => $stats['pages_synced'],
            'total_chunks'   => $stats['total_chunks'],
            'message'        => $result['pages_synced'] > 0
                ? sprintf( '%d new pages ingested (%d already synced). Background summarization scheduled.', $result['pages_synced'], $result['pages_skipped'] )
                : 'All Canvas content is already synced.',
        ), 200 );
    }

    // ─── Data Handlers ───────────────────────────────────────────────────────

    public function get_courses_handler( WP_REST_Request $request ): WP_REST_Response|WP_Error {
        $user_id = $this->authenticate( $request );
        if ( is_wp_error( $user_id ) ) {
            return $user_id;
        }

        $courses = Plato_Database::get_courses_for_user( $user_id );
        $canvas  = new Plato_Canvas( $user_id );
        $sync    = $canvas->get_sync_status();

        return new WP_REST_Response( array(
            'courses'     => $courses,
            'total'       => count( $courses ),
            'sync_status' => $sync['status'],
            'last_sync'   => $sync['last_sync'],
        ), 200 );
    }

    public function get_assignments_handler( WP_REST_Request $request ): WP_REST_Response|WP_Error {
        $user_id = $this->authenticate( $request );
        if ( is_wp_error( $user_id ) ) {
            return $user_id;
        }

        $args = array();
        if ( $request->get_param( 'course_id' ) ) {
            $args['course_id'] = absint( $request->get_param( 'course_id' ) );
        }
        if ( $request->get_param( 'upcoming' ) ) {
            $args['upcoming'] = true;
        }
        if ( $request->get_param( 'limit' ) ) {
            $args['limit'] = min( absint( $request->get_param( 'limit' ) ), 100 );
        }

        $assignments = Plato_Database::get_assignments_for_user( $user_id, $args );

        return new WP_REST_Response( array(
            'assignments' => $assignments,
            'total'       => count( $assignments ),
        ), 200 );
    }

    public function get_course_content_handler( WP_REST_Request $request ): WP_REST_Response|WP_Error {
        $user_id = $this->authenticate( $request );
        if ( is_wp_error( $user_id ) ) {
            return $user_id;
        }

        $course_id = absint( $request->get_param( 'id' ) );
        if ( ! $course_id ) {
            return new WP_Error( 'plato_missing_course', 'Course ID is required.', array( 'status' => 400 ) );
        }

        // Get canvas content items grouped by module.
        $items = Plato_Database::get_canvas_content_for_course( $user_id, $course_id );

        // Group by module.
        $modules = array();
        foreach ( $items as $item ) {
            $mod = $item->module_name ?: 'Ungrouped';
            if ( ! isset( $modules[ $mod ] ) ) {
                $modules[ $mod ] = array();
            }
            $modules[ $mod ][] = array(
                'id'             => (int) $item->id,
                'title'          => $item->title,
                'content_type'   => $item->content_type,
                'chunks_created' => (int) $item->chunks_created,
                'synced_at'      => $item->synced_at,
            );
        }

        // Convert to ordered array format.
        $module_list = array();
        foreach ( $modules as $name => $pages ) {
            $module_list[] = array(
                'module_name' => $name,
                'pages'       => $pages,
            );
        }

        // Also get assignments for this course.
        $assignments = Plato_Database::get_assignments_for_user( $user_id, array( 'course_id' => $course_id ) );

        // Get study notes for this course.
        $study_notes = Plato_Database::get_study_note_files( $user_id, $course_id );

        return new WP_REST_Response( array(
            'modules'      => $module_list,
            'assignments'  => $assignments,
            'study_notes'  => $study_notes,
            'total_pages'  => count( $items ),
        ), 200 );
    }

    // ─── Chat Handlers ──────────────────────────────────────────────────────

    public function get_conversations_handler( WP_REST_Request $request ): WP_REST_Response|WP_Error {
        $user_id = $this->authenticate( $request );
        if ( is_wp_error( $user_id ) ) {
            return $user_id;
        }

        $conversations = Plato_Database::get_conversations_for_user( $user_id );

        return new WP_REST_Response( array(
            'conversations' => $conversations,
        ), 200 );
    }

    public function create_conversation_handler( WP_REST_Request $request ): WP_REST_Response|WP_Error {
        $user_id = $this->authenticate( $request );
        if ( is_wp_error( $user_id ) ) {
            return $user_id;
        }

        $title     = sanitize_text_field( $request->get_param( 'title' ) ?: 'New conversation' );
        $course_id = $request->get_param( 'course_id' ) ? absint( $request->get_param( 'course_id' ) ) : null;
        $mode      = in_array( $request->get_param( 'mode' ), array( 'socratic', 'eli5' ), true )
                     ? $request->get_param( 'mode' ) : 'socratic';

        $conv_id = Plato_Database::create_conversation( $user_id, $title, $course_id, $mode );
        if ( ! $conv_id ) {
            return new WP_Error( 'plato_create_failed', 'Failed to create conversation.', array( 'status' => 500 ) );
        }

        $conversation = Plato_Database::get_conversation( $conv_id, $user_id );

        return new WP_REST_Response( array(
            'conversation' => $conversation,
        ), 201 );
    }

    public function get_conversation_handler( WP_REST_Request $request ): WP_REST_Response|WP_Error {
        $user_id = $this->authenticate( $request );
        if ( is_wp_error( $user_id ) ) {
            return $user_id;
        }

        $conv_id      = absint( $request->get_param( 'id' ) );
        $conversation = Plato_Database::get_conversation( $conv_id, $user_id );

        if ( ! $conversation ) {
            return new WP_Error( 'plato_not_found', 'Conversation not found.', array( 'status' => 404 ) );
        }

        $messages = Plato_Database::get_messages( $conv_id );

        return new WP_REST_Response( array(
            'conversation' => $conversation,
            'messages'     => $messages,
        ), 200 );
    }

    public function delete_conversation_handler( WP_REST_Request $request ): WP_REST_Response|WP_Error {
        $user_id = $this->authenticate( $request );
        if ( is_wp_error( $user_id ) ) {
            return $user_id;
        }

        $conv_id = absint( $request->get_param( 'id' ) );
        $deleted = Plato_Database::delete_conversation( $conv_id, $user_id );

        if ( ! $deleted ) {
            return new WP_Error( 'plato_not_found', 'Conversation not found.', array( 'status' => 404 ) );
        }

        return new WP_REST_Response( array( 'deleted' => true ), 200 );
    }

    public function send_message_handler( WP_REST_Request $request ): WP_REST_Response|WP_Error {
        $user_id = $this->authenticate( $request );
        if ( is_wp_error( $user_id ) ) {
            return $user_id;
        }

        $conv_id = absint( $request->get_param( 'id' ) );
        $content = trim( $request->get_param( 'content' ) ?? '' );

        if ( empty( $content ) ) {
            return new WP_Error( 'plato_empty_message', 'Message content is required.', array( 'status' => 400 ) );
        }

        // Verify conversation ownership.
        $conversation = Plato_Database::get_conversation( $conv_id, $user_id );
        if ( ! $conversation ) {
            return new WP_Error( 'plato_not_found', 'Conversation not found.', array( 'status' => 404 ) );
        }

        // Rate limit check.
        $msg_count = Plato_Database::count_messages_last_hour( $user_id );
        if ( $msg_count >= Plato_LLM::RATE_LIMIT ) {
            return new WP_Error( 'plato_rate_limited', 'Rate limit reached (50 messages/hour). Take a break!', array( 'status' => 429 ) );
        }

        // Save user message.
        Plato_Database::insert_message( $conv_id, 'user', $content );

        // Build message history for LLM.
        $db_messages  = Plato_Database::get_messages( $conv_id );
        $llm_messages = array();
        foreach ( $db_messages as $msg ) {
            if ( $msg->role === 'user' || $msg->role === 'assistant' ) {
                $llm_messages[] = array( 'role' => $msg->role, 'content' => $msg->content );
            }
        }

        // Get course context.
        $course = null;
        if ( $conversation->course_id ) {
            $course = Plato_Database::get_conversation( $conv_id, $user_id );
            // Fetch actual course.
            global $wpdb;
            $course = $wpdb->get_row( $wpdb->prepare(
                "SELECT * FROM {$wpdb->prefix}plato_courses WHERE id = %d",
                $conversation->course_id
            ) );
        }

        // Auto-title: use first message content (trimmed).
        if ( count( $llm_messages ) === 1 ) {
            $auto_title = mb_substr( $content, 0, 60 );
            if ( mb_strlen( $content ) > 60 ) {
                $auto_title .= '...';
            }
            Plato_Database::update_conversation_title( $conv_id, $auto_title );
        }

        // Fetch study notes context for course.
        $study_notes_context = $this->get_study_notes_context( $user_id, $conversation->course_id );

        // Call LLM.
        $result = Plato_LLM::chat( $llm_messages, $conversation->mode, $course, $study_notes_context );
        if ( is_wp_error( $result ) ) {
            return $result;
        }

        // Save assistant message.
        $msg_id = Plato_Database::insert_message( $conv_id, 'assistant', $result['content'], $result['tokens_used'] );

        return new WP_REST_Response( array(
            'message' => array(
                'id'         => $msg_id,
                'role'       => 'assistant',
                'content'    => $result['content'],
                'created_at' => current_time( 'mysql', true ),
            ),
            'tokens_used' => $result['tokens_used'],
        ), 200 );
    }

    public function stream_message_handler( WP_REST_Request $request ) {
        $user_id = $this->authenticate( $request );
        if ( is_wp_error( $user_id ) ) {
            return $user_id;
        }

        $conv_id = absint( $request->get_param( 'id' ) );
        $content = trim( $request->get_param( 'content' ) ?? '' );

        if ( empty( $content ) ) {
            return new WP_Error( 'plato_empty_message', 'Message content is required.', array( 'status' => 400 ) );
        }

        $conversation = Plato_Database::get_conversation( $conv_id, $user_id );
        if ( ! $conversation ) {
            return new WP_Error( 'plato_not_found', 'Conversation not found.', array( 'status' => 404 ) );
        }

        // Rate limit.
        $msg_count = Plato_Database::count_messages_last_hour( $user_id );
        if ( $msg_count >= Plato_LLM::RATE_LIMIT ) {
            return new WP_Error( 'plato_rate_limited', 'Rate limit reached (50 messages/hour).', array( 'status' => 429 ) );
        }

        // Save user message.
        Plato_Database::insert_message( $conv_id, 'user', $content );

        // Build message history.
        $db_messages  = Plato_Database::get_messages( $conv_id );
        $llm_messages = array();
        foreach ( $db_messages as $msg ) {
            if ( $msg->role === 'user' || $msg->role === 'assistant' ) {
                $llm_messages[] = array( 'role' => $msg->role, 'content' => $msg->content );
            }
        }

        // Course context.
        $course = null;
        if ( $conversation->course_id ) {
            global $wpdb;
            $course = $wpdb->get_row( $wpdb->prepare(
                "SELECT * FROM {$wpdb->prefix}plato_courses WHERE id = %d",
                $conversation->course_id
            ) );
        }

        // Auto-title on first message.
        if ( count( $llm_messages ) === 1 ) {
            $auto_title = mb_substr( $content, 0, 60 );
            if ( mb_strlen( $content ) > 60 ) {
                $auto_title .= '...';
            }
            Plato_Database::update_conversation_title( $conv_id, $auto_title );
        }

        // Stream — this function does not return, it outputs SSE directly.
        // We need to capture the full response to save it after streaming.
        // Strategy: use the non-streaming endpoint for now, with a "collecting" wrapper.
        // For true SSE streaming, we'd need to save the message after the stream completes.
        // Let's use the non-streaming call but return quickly with a streaming-like response.

        // Actually, let's do proper streaming: output SSE, then save at the end.
        // We'll buffer the content ourselves.

        $api_key  = Plato_LLM::get_api_key();
        if ( ! $api_key ) {
            return new WP_Error( 'plato_llm_not_configured', 'LLM API key not configured.', array( 'status' => 400 ) );
        }

        $provider = Plato_LLM::get_provider();
        $model    = Plato_LLM::get_model();

        // Fetch study notes context for course.
        $study_notes_context = $this->get_study_notes_context( $user_id, $conversation->course_id );
        $system   = Plato_LLM::build_system_prompt( $conversation->mode, $course, $study_notes_context );

        // Disable output buffering, set SSE headers.
        while ( ob_get_level() ) {
            ob_end_clean();
        }
        header( 'Content-Type: text/event-stream' );
        header( 'Cache-Control: no-cache' );
        header( 'Connection: keep-alive' );
        header( 'X-Accel-Buffering: no' );

        $origin  = isset( $_SERVER['HTTP_ORIGIN'] ) ? $_SERVER['HTTP_ORIGIN'] : '';
        $allowed = array( 'http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://plato.local' );
        if ( in_array( $origin, $allowed, true ) ) {
            header( 'Access-Control-Allow-Origin: ' . $origin );
            header( 'Access-Control-Allow-Credentials: true' );
        }

        $full_response = '';
        $conv_id_save  = $conv_id;

        if ( $provider === Plato_LLM::PROVIDER_ANTHROPIC ) {
            $url     = 'https://api.anthropic.com/v1/messages';
            $headers = array(
                'x-api-key: ' . $api_key,
                'anthropic-version: 2023-06-01',
                'Content-Type: application/json',
            );
            $payload = wp_json_encode( array(
                'model'      => $model,
                'system'     => $system,
                'messages'   => $llm_messages,
                'max_tokens' => 1024,
                'stream'     => true,
            ) );
        } else {
            $url     = 'https://api.openai.com/v1/chat/completions';
            $headers = array(
                'Authorization: Bearer ' . $api_key,
                'Content-Type: application/json',
            );
            $api_messages = array_merge(
                array( array( 'role' => 'system', 'content' => $system ) ),
                $llm_messages
            );
            $payload = wp_json_encode( array(
                'model'       => $model,
                'messages'    => $api_messages,
                'max_tokens'  => 1024,
                'temperature' => 0.7,
                'stream'      => true,
            ) );
        }

        $ch = curl_init( $url );
        curl_setopt_array( $ch, array(
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $payload,
            CURLOPT_HTTPHEADER     => $headers,
            CURLOPT_RETURNTRANSFER => false,
            CURLOPT_TIMEOUT        => 120,
            CURLOPT_WRITEFUNCTION  => function ( $ch, $data ) use ( $provider, &$full_response ) {
                $lines = explode( "\n", $data );
                foreach ( $lines as $line ) {
                    $line = trim( $line );
                    if ( empty( $line ) || ! str_starts_with( $line, 'data: ' ) ) {
                        continue;
                    }
                    $json_str = substr( $line, 6 );

                    if ( $provider === Plato_LLM::PROVIDER_OPENAI ) {
                        if ( $json_str === '[DONE]' ) {
                            echo "data: [DONE]\n\n";
                            if ( ob_get_level() ) ob_flush();
                            flush();
                            continue;
                        }
                        $parsed = json_decode( $json_str, true );
                        $delta  = $parsed['choices'][0]['delta']['content'] ?? '';
                        if ( $delta !== '' ) {
                            $full_response .= $delta;
                            echo 'data: ' . wp_json_encode( array( 'content' => $delta ) ) . "\n\n";
                            if ( ob_get_level() ) ob_flush();
                            flush();
                        }
                    } else {
                        $parsed = json_decode( $json_str, true );
                        if ( ! $parsed ) continue;
                        $type = $parsed['type'] ?? '';
                        if ( $type === 'content_block_delta' ) {
                            $delta = $parsed['delta']['text'] ?? '';
                            if ( $delta !== '' ) {
                                $full_response .= $delta;
                                echo 'data: ' . wp_json_encode( array( 'content' => $delta ) ) . "\n\n";
                                if ( ob_get_level() ) ob_flush();
                                flush();
                            }
                        } elseif ( $type === 'message_stop' ) {
                            echo "data: [DONE]\n\n";
                            if ( ob_get_level() ) ob_flush();
                            flush();
                        }
                    }
                }
                return strlen( $data );
            },
        ) );

        curl_exec( $ch );
        $curl_err = curl_error( $ch );
        curl_close( $ch );

        if ( $curl_err ) {
            echo 'data: ' . wp_json_encode( array( 'error' => $curl_err ) ) . "\n\n";
            flush();
        }

        // Save the full assistant response to the database.
        if ( ! empty( $full_response ) ) {
            Plato_Database::insert_message( $conv_id_save, 'assistant', $full_response );
        }

        exit;
    }

    // ─── Study Notes Handlers (P3) ─────────────────────────────────────────

    public function upload_note_handler( WP_REST_Request $request ): WP_REST_Response|WP_Error {
        $user_id = $this->authenticate( $request );
        if ( is_wp_error( $user_id ) ) {
            return $user_id;
        }

        $course_id = absint( $request->get_param( 'course_id' ) );
        if ( ! $course_id ) {
            return new WP_Error( 'plato_missing_course', 'course_id is required.', array( 'status' => 400 ) );
        }

        if ( empty( $_FILES['file'] ) ) {
            return new WP_Error( 'plato_no_file', 'No file uploaded.', array( 'status' => 400 ) );
        }

        $file = $_FILES['file'];

        // Validate.
        $valid = Plato_Document_Processor::validate_file( $file );
        if ( is_wp_error( $valid ) ) {
            return $valid;
        }

        // Store file.
        $relative_path = Plato_Document_Processor::store_file( $file, $user_id );
        if ( is_wp_error( $relative_path ) ) {
            return $relative_path;
        }

        $ext = strtolower( pathinfo( $file['name'], PATHINFO_EXTENSION ) );

        // Create initial study note row.
        $note_id = Plato_Database::insert_study_note( array(
            'user_id'      => $user_id,
            'course_id'    => $course_id,
            'file_name'    => sanitize_file_name( $file['name'] ),
            'file_path'    => $relative_path,
            'file_type'    => $ext,
            'file_size'    => $file['size'],
            'chunk_index'  => 0,
            'total_chunks' => 0,
            'status'       => 'pending',
        ) );

        if ( ! $note_id ) {
            return new WP_Error( 'plato_insert_failed', 'Failed to create note record.', array( 'status' => 500 ) );
        }

        // For small files (< 2MB), process immediately inline.
        $processing = false;
        if ( $file['size'] < 2 * 1024 * 1024 ) {
            Plato_Document_Processor::process_document( $note_id );
            // Now summarize all pending chunks.
            $pending = Plato_Database::get_pending_notes( 50 );
            foreach ( $pending as $chunk ) {
                Plato_Document_Processor::process_document( $chunk->id );
            }
            $processing = false;
        } else {
            // Schedule background processing.
            wp_schedule_single_event( time() + 5, 'plato_process_documents' );
            $processing = true;
        }

        $notes = Plato_Database::get_study_note_files( $user_id, $course_id );

        return new WP_REST_Response( array(
            'success'    => true,
            'note_id'    => $note_id,
            'processing' => $processing,
            'notes'      => $notes,
        ), 201 );
    }

    public function get_notes_handler( WP_REST_Request $request ): WP_REST_Response|WP_Error {
        $user_id = $this->authenticate( $request );
        if ( is_wp_error( $user_id ) ) {
            return $user_id;
        }

        $course_id = $request->get_param( 'course_id' ) ? absint( $request->get_param( 'course_id' ) ) : null;
        $notes     = Plato_Database::get_study_note_files( $user_id, $course_id );

        return new WP_REST_Response( array(
            'notes' => $notes,
            'total' => count( $notes ),
        ), 200 );
    }

    public function delete_note_handler( WP_REST_Request $request ): WP_REST_Response|WP_Error {
        $user_id = $this->authenticate( $request );
        if ( is_wp_error( $user_id ) ) {
            return $user_id;
        }

        $file_name = sanitize_file_name( $request->get_param( 'file_name' ) ?? '' );
        $course_id = absint( $request->get_param( 'course_id' ) );

        if ( empty( $file_name ) || ! $course_id ) {
            return new WP_Error( 'plato_missing_params', 'file_name and course_id are required.', array( 'status' => 400 ) );
        }

        Plato_Database::delete_study_note_file( $user_id, $file_name, $course_id );

        return new WP_REST_Response( array( 'deleted' => true ), 200 );
    }

    // ─── Training Zone Handlers ─────────────────────────────────────────────

    public function get_training_modules_handler( WP_REST_Request $request ): WP_REST_Response|WP_Error {
        $user_id = $this->authenticate( $request );
        if ( is_wp_error( $user_id ) ) {
            return $user_id;
        }

        $course_id = absint( $request->get_param( 'course_id' ) );
        if ( ! $course_id ) {
            // Return all courses with their modules.
            $user_courses = Plato_Database::get_courses_for_user( $user_id );
            $result = array();
            foreach ( $user_courses as $c ) {
                $modules = Plato_Database::get_training_modules_for_course( $user_id, (int) $c->id );
                $total_modules  = count( $modules );
                $mastered_count = 0;
                foreach ( $modules as $m ) {
                    if ( $m['mastered'] ) {
                        $mastered_count++;
                    }
                }
                $result[] = array(
                    'course_id'       => (int) $c->id,
                    'course_name'     => $c->name,
                    'course_code'     => $c->course_code,
                    'total_modules'   => $total_modules,
                    'mastered_modules' => $mastered_count,
                    'modules'         => $modules,
                );
            }
            return new WP_REST_Response( array( 'courses' => $result ), 200 );
        }

        $modules = Plato_Database::get_training_modules_for_course( $user_id, $course_id );
        return new WP_REST_Response( array( 'modules' => $modules ), 200 );
    }

    public function generate_training_handler( WP_REST_Request $request ): WP_REST_Response|WP_Error {
        $user_id = $this->authenticate( $request );
        if ( is_wp_error( $user_id ) ) {
            return $user_id;
        }

        $course_id   = absint( $request->get_param( 'course_id' ) );
        $module_name = urldecode( $request->get_param( 'module_name' ) );

        if ( ! $course_id || empty( $module_name ) ) {
            return new WP_Error( 'plato_missing_params', 'course_id and module_name are required.', array( 'status' => 400 ) );
        }

        // Get module content.
        $content = Plato_Database::get_module_content_for_training( $user_id, $course_id, $module_name );
        if ( empty( $content ) ) {
            return new WP_Error( 'plato_no_content', 'No synced content found for this module. Sync Canvas content first.', array( 'status' => 400 ) );
        }

        // Delete existing scenarios for this module (regenerate).
        Plato_Database::delete_training_scenarios( $user_id, $course_id, $module_name );

        // Increase time limit for LLM call.
        set_time_limit( 120 );

        // Call LLM to generate scenarios.
        $system = "You are an expert educational assessment designer. Generate scenario-based exercises for university students.\n\n"
                . "INSTRUCTIONS:\n"
                . "- Create 3-5 realistic scenario-based exercises from the provided course content\n"
                . "- Each scenario should have a title, a context paragraph (2-3 sentences setting up a realistic situation), and exactly 5 questions\n"
                . "- Each scenario must have 4 MCQ questions (10 points each) and 1 short-answer question (10 points) = 50 points total per scenario\n"
                . "- MCQ options should have exactly 4 choices (A, B, C, D)\n"
                . "- Scenarios should be progressively more challenging\n"
                . "- Short-answer questions should require applying knowledge, not just recalling facts\n"
                . "- Include a rubric for each short-answer question to guide grading\n\n"
                . "RESPOND WITH VALID JSON ONLY — no markdown, no explanation. Use this exact structure:\n"
                . '{"scenarios":[{"title":"...","context":"...","questions":[{"type":"mcq","question":"...","options":["A","B","C","D"],"correct_option":0,"points":10},{"type":"short_answer","question":"...","rubric":"criteria for grading","points":10}]}]}';

        $messages = array( array( 'role' => 'user', 'content' => "Generate training scenarios from this course module content:\n\n" . $content ) );

        $api_key  = Plato_LLM::get_api_key();
        if ( ! $api_key ) {
            return new WP_Error( 'plato_llm_not_configured', 'LLM API key not configured.', array( 'status' => 400 ) );
        }

        $provider = Plato_LLM::get_provider();
        $model    = Plato_LLM::get_model();

        if ( $provider === Plato_LLM::PROVIDER_ANTHROPIC ) {
            $result = self::call_llm_anthropic( $api_key, $model, $system, $messages );
        } else {
            $result = self::call_llm_openai( $api_key, $model, $system, $messages );
        }

        if ( is_wp_error( $result ) ) {
            return $result;
        }

        // Parse JSON response.
        $response_text = $result['content'];

        // Try to extract JSON from the response (handle markdown code blocks).
        if ( preg_match( '/```(?:json)?\s*([\s\S]*?)```/', $response_text, $matches ) ) {
            $response_text = trim( $matches[1] );
        }

        $parsed = json_decode( $response_text, true );
        if ( ! $parsed || empty( $parsed['scenarios'] ) ) {
            return new WP_Error( 'plato_parse_error', 'Failed to parse LLM response into scenarios.', array( 'status' => 500 ) );
        }

        // Insert scenarios into DB.
        $inserted = array();
        foreach ( $parsed['scenarios'] as $index => $scenario ) {
            $total_points = 0;
            foreach ( $scenario['questions'] ?? array() as $q ) {
                $total_points += (int) ( $q['points'] ?? 10 );
            }

            $id = Plato_Database::insert_training_scenario( array(
                'user_id'        => $user_id,
                'course_id'      => $course_id,
                'module_name'    => $module_name,
                'scenario_index' => $index,
                'title'          => sanitize_text_field( $scenario['title'] ?? "Scenario " . ( $index + 1 ) ),
                'context'        => wp_kses_post( $scenario['context'] ?? '' ),
                'questions'      => wp_json_encode( $scenario['questions'] ?? array() ),
                'total_points'   => $total_points,
            ) );

            if ( $id ) {
                $inserted[] = $id;
            }
        }

        $scenarios = Plato_Database::get_training_scenarios( $user_id, $course_id, $module_name );

        return new WP_REST_Response( array(
            'success'    => true,
            'generated'  => count( $inserted ),
            'scenarios'  => $this->strip_scenario_answers( $scenarios ),
        ), 201 );
    }

    public function get_training_scenarios_handler( WP_REST_Request $request ): WP_REST_Response|WP_Error {
        $user_id = $this->authenticate( $request );
        if ( is_wp_error( $user_id ) ) {
            return $user_id;
        }

        $course_id   = absint( $request->get_param( 'course_id' ) );
        $module_name = urldecode( $request->get_param( 'module_name' ) );

        $scenarios = Plato_Database::get_training_scenarios( $user_id, $course_id, $module_name );

        // Enrich with best attempt info and strip answers.
        $result = array();
        foreach ( $scenarios as $s ) {
            $best    = Plato_Database::get_best_attempt( $user_id, (int) $s->id );
            $count   = Plato_Database::count_attempts( $user_id, (int) $s->id );
            $questions = json_decode( $s->questions, true ) ?: array();

            // Strip correct_option and rubric.
            $safe_questions = array();
            foreach ( $questions as $q ) {
                $safe_q = array(
                    'type'     => $q['type'],
                    'question' => $q['question'],
                    'points'   => $q['points'] ?? 10,
                );
                if ( $q['type'] === 'mcq' ) {
                    $safe_q['options'] = $q['options'];
                }
                $safe_questions[] = $safe_q;
            }

            $result[] = array(
                'id'             => (int) $s->id,
                'scenario_index' => (int) $s->scenario_index,
                'title'          => $s->title,
                'context'        => $s->context,
                'questions'      => $safe_questions,
                'total_points'   => (int) $s->total_points,
                'best_score'     => $best ? (float) $best->score_pct : null,
                'passed'         => $best ? (bool) $best->passed : false,
                'attempt_count'  => $count,
                'created_at'     => $s->created_at,
            );
        }

        return new WP_REST_Response( array( 'scenarios' => $result ), 200 );
    }

    public function submit_training_handler( WP_REST_Request $request ): WP_REST_Response|WP_Error {
        $user_id = $this->authenticate( $request );
        if ( is_wp_error( $user_id ) ) {
            return $user_id;
        }

        $scenario_id = absint( $request->get_param( 'scenario_id' ) );
        $answers     = $request->get_param( 'answers' );

        if ( ! $scenario_id || ! is_array( $answers ) ) {
            return new WP_Error( 'plato_missing_params', 'scenario_id and answers array are required.', array( 'status' => 400 ) );
        }

        $scenario = Plato_Database::get_training_scenario( $scenario_id, $user_id );
        if ( ! $scenario ) {
            return new WP_Error( 'plato_not_found', 'Scenario not found.', array( 'status' => 404 ) );
        }

        set_time_limit( 120 );

        $questions = json_decode( $scenario->questions, true ) ?: array();
        $mcq_points          = 0;
        $short_answer_points = 0;
        $max_points          = (int) $scenario->total_points;
        $feedback            = array();

        foreach ( $questions as $i => $q ) {
            $student_answer = $answers[ $i ] ?? null;

            if ( $q['type'] === 'mcq' ) {
                $correct = (int) ( $q['correct_option'] ?? -1 );
                $chosen  = is_numeric( $student_answer ) ? (int) $student_answer : -1;
                $is_correct = $chosen === $correct;
                $points = $is_correct ? (int) ( $q['points'] ?? 10 ) : 0;
                $mcq_points += $points;

                $feedback[] = array(
                    'question_index' => $i,
                    'type'           => 'mcq',
                    'correct'        => $is_correct,
                    'correct_option' => $correct,
                    'chosen'         => $chosen,
                    'points'         => $points,
                    'max_points'     => (int) ( $q['points'] ?? 10 ),
                );
            } elseif ( $q['type'] === 'short_answer' ) {
                $student_text = is_string( $student_answer ) ? trim( $student_answer ) : '';

                if ( empty( $student_text ) ) {
                    $feedback[] = array(
                        'question_index' => $i,
                        'type'           => 'short_answer',
                        'score'          => 0,
                        'max_points'     => (int) ( $q['points'] ?? 10 ),
                        'feedback'       => 'No answer provided.',
                    );
                    continue;
                }

                // LLM grade the short answer.
                $grading_result = $this->grade_short_answer(
                    $q['question'],
                    $q['rubric'] ?? '',
                    $student_text,
                    (int) ( $q['points'] ?? 10 )
                );

                $sa_score = 0;
                $sa_feedback = 'Could not grade this answer.';

                if ( ! is_wp_error( $grading_result ) ) {
                    $sa_score    = (int) ( $grading_result['score'] ?? 0 );
                    $sa_feedback = $grading_result['feedback'] ?? '';
                }

                $short_answer_points += $sa_score;

                $feedback[] = array(
                    'question_index' => $i,
                    'type'           => 'short_answer',
                    'score'          => $sa_score,
                    'max_points'     => (int) ( $q['points'] ?? 10 ),
                    'feedback'       => $sa_feedback,
                );
            }
        }

        $total_points = $mcq_points + $short_answer_points;
        $score_pct    = $max_points > 0 ? round( ( $total_points / $max_points ) * 100, 2 ) : 0;
        $passed       = $score_pct >= 90;

        $attempt_id = Plato_Database::insert_training_attempt( array(
            'user_id'             => $user_id,
            'scenario_id'        => $scenario_id,
            'answers'            => wp_json_encode( $answers ),
            'mcq_points'         => $mcq_points,
            'short_answer_points' => $short_answer_points,
            'total_points'       => $total_points,
            'max_points'         => $max_points,
            'score_pct'          => $score_pct,
            'passed'             => $passed ? 1 : 0,
            'feedback'           => wp_json_encode( $feedback ),
        ) );

        return new WP_REST_Response( array(
            'attempt_id'          => $attempt_id,
            'mcq_points'          => $mcq_points,
            'short_answer_points' => $short_answer_points,
            'total_points'        => $total_points,
            'max_points'          => $max_points,
            'score_pct'           => $score_pct,
            'passed'              => $passed,
            'feedback'            => $feedback,
        ), 200 );
    }

    public function get_training_progress_handler( WP_REST_Request $request ): WP_REST_Response|WP_Error {
        $user_id = $this->authenticate( $request );
        if ( is_wp_error( $user_id ) ) {
            return $user_id;
        }

        $course_id = absint( $request->get_param( 'course_id' ) );
        if ( ! $course_id ) {
            return new WP_Error( 'plato_missing_params', 'course_id is required.', array( 'status' => 400 ) );
        }

        $modules = Plato_Database::get_training_modules_for_course( $user_id, $course_id );

        $total_modules  = count( $modules );
        $mastered_count = 0;
        foreach ( $modules as $m ) {
            if ( $m['mastered'] ) {
                $mastered_count++;
            }
        }

        return new WP_REST_Response( array(
            'course_id'        => $course_id,
            'total_modules'    => $total_modules,
            'mastered_modules' => $mastered_count,
            'modules'          => $modules,
        ), 200 );
    }

    // ─── Training Zone Helpers ───────────────────────────────────────────────

    private function strip_scenario_answers( array $scenarios ): array {
        $result = array();
        foreach ( $scenarios as $s ) {
            $questions = json_decode( $s->questions, true ) ?: array();
            $safe_questions = array();
            foreach ( $questions as $q ) {
                $safe_q = array(
                    'type'     => $q['type'],
                    'question' => $q['question'],
                    'points'   => $q['points'] ?? 10,
                );
                if ( $q['type'] === 'mcq' ) {
                    $safe_q['options'] = $q['options'];
                }
                $safe_questions[] = $safe_q;
            }
            $result[] = array(
                'id'             => (int) $s->id,
                'scenario_index' => (int) $s->scenario_index,
                'title'          => $s->title,
                'context'        => $s->context,
                'questions'      => $safe_questions,
                'total_points'   => (int) $s->total_points,
                'created_at'     => $s->created_at,
            );
        }
        return $result;
    }

    private function grade_short_answer( string $question, string $rubric, string $student_answer, int $max_points ): array|WP_Error {
        $api_key = Plato_LLM::get_api_key();
        if ( ! $api_key ) {
            return new WP_Error( 'plato_llm_not_configured', 'LLM not configured.' );
        }

        $system = "You are an encouraging educational grader. Grade the student's short answer.\n\n"
                . "RESPOND WITH VALID JSON ONLY:\n"
                . '{"score": 0, "feedback": "encouraging feedback"}' . "\n\n"
                . "Score range: 0 to {$max_points}. Be fair but encouraging. "
                . "Give partial credit for partially correct answers.";

        $user_msg = "QUESTION: {$question}\n\nRUBRIC: {$rubric}\n\nSTUDENT ANSWER: {$student_answer}\n\nGrade this answer (0-{$max_points} points):";

        $messages = array( array( 'role' => 'user', 'content' => $user_msg ) );

        $provider = Plato_LLM::get_provider();
        $model    = Plato_LLM::get_model();

        if ( $provider === Plato_LLM::PROVIDER_ANTHROPIC ) {
            $result = self::call_llm_anthropic( $api_key, $model, $system, $messages );
        } else {
            $result = self::call_llm_openai( $api_key, $model, $system, $messages );
        }

        if ( is_wp_error( $result ) ) {
            return $result;
        }

        $response_text = $result['content'];
        if ( preg_match( '/```(?:json)?\s*([\s\S]*?)```/', $response_text, $matches ) ) {
            $response_text = trim( $matches[1] );
        }

        $parsed = json_decode( $response_text, true );
        if ( ! $parsed || ! isset( $parsed['score'] ) ) {
            return array( 'score' => 0, 'feedback' => 'Unable to grade automatically.' );
        }

        // Clamp score.
        $parsed['score'] = max( 0, min( $max_points, (int) $parsed['score'] ) );

        return $parsed;
    }

    private static function call_llm_openai( string $api_key, string $model, string $system, array $messages ): array|WP_Error {
        $api_messages = array_merge(
            array( array( 'role' => 'system', 'content' => $system ) ),
            $messages
        );

        $response = wp_remote_post( 'https://api.openai.com/v1/chat/completions', array(
            'headers' => array(
                'Authorization' => 'Bearer ' . $api_key,
                'Content-Type'  => 'application/json',
            ),
            'body'    => wp_json_encode( array(
                'model'       => $model,
                'messages'    => $api_messages,
                'max_tokens'  => 2048,
                'temperature' => 0.7,
            ) ),
            'timeout' => 90,
        ) );

        if ( is_wp_error( $response ) ) {
            return new WP_Error( 'plato_llm_request_failed', $response->get_error_message() );
        }

        $status = wp_remote_retrieve_response_code( $response );
        $body   = json_decode( wp_remote_retrieve_body( $response ), true );

        if ( $status >= 400 ) {
            return new WP_Error( 'plato_llm_api_error', $body['error']['message'] ?? "API returned $status", array( 'status' => $status ) );
        }

        return array(
            'content'     => $body['choices'][0]['message']['content'] ?? '',
            'tokens_used' => $body['usage']['total_tokens'] ?? 0,
        );
    }

    private static function call_llm_anthropic( string $api_key, string $model, string $system, array $messages ): array|WP_Error {
        $response = wp_remote_post( 'https://api.anthropic.com/v1/messages', array(
            'headers' => array(
                'x-api-key'         => $api_key,
                'anthropic-version' => '2023-06-01',
                'Content-Type'      => 'application/json',
            ),
            'body'    => wp_json_encode( array(
                'model'      => $model,
                'system'     => $system,
                'messages'   => $messages,
                'max_tokens' => 2048,
            ) ),
            'timeout' => 90,
        ) );

        if ( is_wp_error( $response ) ) {
            return new WP_Error( 'plato_llm_request_failed', $response->get_error_message() );
        }

        $status = wp_remote_retrieve_response_code( $response );
        $body   = json_decode( wp_remote_retrieve_body( $response ), true );

        if ( $status >= 400 ) {
            return new WP_Error( 'plato_llm_api_error', $body['error']['message'] ?? "API returned $status", array( 'status' => $status ) );
        }

        $content = '';
        foreach ( $body['content'] ?? array() as $block ) {
            if ( $block['type'] === 'text' ) {
                $content .= $block['text'];
            }
        }

        return array(
            'content'     => $content,
            'tokens_used' => ( $body['usage']['input_tokens'] ?? 0 ) + ( $body['usage']['output_tokens'] ?? 0 ),
        );
    }

    // ─── Dashboard Handlers ─────────────────────────────────────────────────

    public function get_dashboard_stats_handler( WP_REST_Request $request ): WP_REST_Response|WP_Error {
        $user_id = $this->authenticate( $request );
        if ( is_wp_error( $user_id ) ) {
            return $user_id;
        }

        $stats = Plato_Database::get_dashboard_stats( $user_id );

        return new WP_REST_Response( $stats, 200 );
    }

    // ─── Settings Handlers ───────────────────────────────────────────────────

    public function get_llm_settings_handler( WP_REST_Request $request ): WP_REST_Response|WP_Error {
        $user_id = $this->authenticate( $request );
        if ( is_wp_error( $user_id ) ) {
            return $user_id;
        }

        return new WP_REST_Response( array(
            'configured' => Plato_LLM::is_configured(),
            'provider'   => Plato_LLM::get_provider(),
            'model'      => Plato_LLM::get_model(),
        ), 200 );
    }

    public function save_llm_settings_handler( WP_REST_Request $request ): WP_REST_Response|WP_Error {
        $user_id = $this->authenticate( $request );
        if ( is_wp_error( $user_id ) ) {
            return $user_id;
        }

        $provider = $request->get_param( 'provider' );
        $api_key  = $request->get_param( 'api_key' );
        $model    = $request->get_param( 'model' ) ?? '';

        if ( ! in_array( $provider, array( 'openai', 'anthropic' ), true ) ) {
            return new WP_Error( 'plato_invalid_provider', 'Provider must be openai or anthropic.', array( 'status' => 400 ) );
        }

        if ( empty( $api_key ) ) {
            return new WP_Error( 'plato_missing_key', 'API key is required.', array( 'status' => 400 ) );
        }

        Plato_LLM::save_settings( $provider, $api_key, $model );

        return new WP_REST_Response( array(
            'success'  => true,
            'provider' => $provider,
            'model'    => Plato_LLM::get_model(),
        ), 200 );
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private function authenticate( WP_REST_Request $request ): int|WP_Error {
        return Plato_Auth::get_current_user_id();
    }

    /**
     * Build study notes context string for LLM injection.
     * Returns null if no notes exist or course_id is null.
     */
    private function get_study_notes_context( int $user_id, $course_id ): ?string {
        if ( ! $course_id ) {
            return null;
        }

        $summaries = Plato_Database::get_notes_summaries_for_course( $user_id, (int) $course_id );
        if ( empty( $summaries ) ) {
            return null;
        }

        $notes_text = '';
        foreach ( $summaries as $s ) {
            $notes_text .= $s->summary . "\n\n";
        }

        // Cap at ~4000 chars to avoid blowing up the context window.
        $notes_text = trim( $notes_text );
        if ( mb_strlen( $notes_text ) > 4000 ) {
            $notes_text = mb_substr( $notes_text, 0, 4000 ) . "\n\n... (additional notes truncated)";
        }

        return $notes_text;
    }
}
