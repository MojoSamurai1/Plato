<?php
/**
 * Plato_Database
 *
 * Schema definition and CRUD for custom tables.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Plato_Database {

    const DB_VERSION_OPTION = 'plato_db_version';

    /**
     * Create or update custom tables via dbDelta.
     */
    public static function create_tables(): void {
        global $wpdb;

        $charset_collate = $wpdb->get_charset_collate();

        $sql = "CREATE TABLE {$wpdb->prefix}plato_courses (
            id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            user_id         BIGINT UNSIGNED NOT NULL,
            canvas_course_id BIGINT UNSIGNED NOT NULL,
            name            VARCHAR(255)    NOT NULL DEFAULT '',
            course_code     VARCHAR(100)    NOT NULL DEFAULT '',
            workflow_state  VARCHAR(50)     NOT NULL DEFAULT 'available',
            start_at        DATETIME                 DEFAULT NULL,
            end_at          DATETIME                 DEFAULT NULL,
            synced_at       DATETIME                 DEFAULT NULL,
            created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY     (id),
            UNIQUE KEY      canvas_user (canvas_course_id, user_id),
            KEY             user_id (user_id)
        ) $charset_collate;

        CREATE TABLE {$wpdb->prefix}plato_conversations (
            id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            user_id         BIGINT UNSIGNED NOT NULL,
            course_id       BIGINT UNSIGNED          DEFAULT NULL,
            title           VARCHAR(255)    NOT NULL DEFAULT '',
            mode            VARCHAR(20)     NOT NULL DEFAULT 'socratic',
            created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY     (id),
            KEY             user_id (user_id),
            KEY             course_id (course_id)
        ) $charset_collate;

        CREATE TABLE {$wpdb->prefix}plato_messages (
            id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            conversation_id BIGINT UNSIGNED NOT NULL,
            role            VARCHAR(20)     NOT NULL DEFAULT 'user',
            content         LONGTEXT        NOT NULL,
            tokens_used     INT UNSIGNED             DEFAULT NULL,
            created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY     (id),
            KEY             conversation_id (conversation_id)
        ) $charset_collate;

        CREATE TABLE {$wpdb->prefix}plato_study_notes (
            id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            user_id         BIGINT UNSIGNED NOT NULL,
            course_id       BIGINT UNSIGNED NOT NULL,
            file_name       VARCHAR(255)    NOT NULL DEFAULT '',
            file_path       VARCHAR(500)    NOT NULL DEFAULT '',
            file_type       VARCHAR(20)     NOT NULL DEFAULT '',
            file_size       BIGINT UNSIGNED NOT NULL DEFAULT 0,
            chunk_index     INT UNSIGNED    NOT NULL DEFAULT 0,
            total_chunks    INT UNSIGNED    NOT NULL DEFAULT 0,
            content         LONGTEXT                 DEFAULT NULL,
            summary         LONGTEXT                 DEFAULT NULL,
            status          VARCHAR(20)     NOT NULL DEFAULT 'pending',
            error_message   VARCHAR(500)             DEFAULT NULL,
            processed_at    DATETIME                 DEFAULT NULL,
            created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY     (id),
            KEY             user_course (user_id, course_id),
            KEY             status (status),
            KEY             file_lookup (user_id, file_name, chunk_index)
        ) $charset_collate;

        CREATE TABLE {$wpdb->prefix}plato_canvas_content (
            id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            user_id           BIGINT UNSIGNED NOT NULL,
            canvas_course_id  BIGINT UNSIGNED NOT NULL,
            plato_course_id   BIGINT UNSIGNED NOT NULL,
            content_key       VARCHAR(500)    NOT NULL DEFAULT '',
            content_type      VARCHAR(50)     NOT NULL DEFAULT 'page',
            title             VARCHAR(255)    NOT NULL DEFAULT '',
            module_name       VARCHAR(255)    NOT NULL DEFAULT '',
            chunks_created    INT UNSIGNED    NOT NULL DEFAULT 0,
            synced_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY       (id),
            UNIQUE KEY        user_content (user_id, content_key(191)),
            KEY               user_course (user_id, canvas_course_id)
        ) $charset_collate;

        CREATE TABLE {$wpdb->prefix}plato_assignments (
            id                   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            user_id              BIGINT UNSIGNED NOT NULL,
            canvas_assignment_id BIGINT UNSIGNED NOT NULL,
            canvas_course_id     BIGINT UNSIGNED NOT NULL,
            plato_course_id      BIGINT UNSIGNED NOT NULL,
            name                 VARCHAR(255)    NOT NULL DEFAULT '',
            description          LONGTEXT                 DEFAULT NULL,
            due_at               DATETIME                 DEFAULT NULL,
            points_possible      DECIMAL(8,2)             DEFAULT NULL,
            submission_types     VARCHAR(255)    NOT NULL DEFAULT '',
            workflow_state       VARCHAR(50)     NOT NULL DEFAULT 'published',
            synced_at            DATETIME                 DEFAULT NULL,
            created_at           DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at           DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY          (id),
            UNIQUE KEY           canvas_user (canvas_assignment_id, user_id),
            KEY                  plato_course_id (plato_course_id),
            KEY                  user_due (user_id, due_at)
        ) $charset_collate;

        CREATE TABLE {$wpdb->prefix}plato_training_scenarios (
            id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            user_id         BIGINT UNSIGNED NOT NULL,
            course_id       BIGINT UNSIGNED NOT NULL,
            module_name     VARCHAR(255)    NOT NULL DEFAULT '',
            scenario_index  TINYINT UNSIGNED NOT NULL DEFAULT 0,
            title           VARCHAR(255)    NOT NULL DEFAULT '',
            context         TEXT            NOT NULL,
            questions       LONGTEXT        NOT NULL,
            total_points    INT UNSIGNED    NOT NULL DEFAULT 0,
            created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY     (id),
            KEY             user_module (user_id, course_id, module_name(191))
        ) $charset_collate;

        CREATE TABLE {$wpdb->prefix}plato_training_attempts (
            id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            user_id             BIGINT UNSIGNED NOT NULL,
            scenario_id         BIGINT UNSIGNED NOT NULL,
            answers             LONGTEXT        NOT NULL,
            mcq_points          INT UNSIGNED    NOT NULL DEFAULT 0,
            short_answer_points INT UNSIGNED    NOT NULL DEFAULT 0,
            total_points        INT UNSIGNED    NOT NULL DEFAULT 0,
            max_points          INT UNSIGNED    NOT NULL DEFAULT 0,
            score_pct           DECIMAL(5,2)    NOT NULL DEFAULT 0.00,
            passed              TINYINT(1)      NOT NULL DEFAULT 0,
            feedback            LONGTEXT                 DEFAULT NULL,
            created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY         (id),
            KEY                 user_scenario (user_id, scenario_id)
        ) $charset_collate;";

        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        dbDelta( $sql );

        update_option( self::DB_VERSION_OPTION, PLATO_VERSION );
    }

    /**
     * Get current DB version.
     */
    public static function get_db_version(): string {
        return get_option( self::DB_VERSION_OPTION, '0' );
    }

    // ─── Courses CRUD ────────────────────────────────────────────────────────

    /**
     * Insert or update a course row.
     *
     * @param array $data Associative array matching plato_courses columns.
     * @return int|false Inserted/updated row ID, or false on failure.
     */
    public static function insert_course( array $data ): int|false {
        global $wpdb;
        $table = $wpdb->prefix . 'plato_courses';

        // Check if row exists for this canvas_course_id + user_id.
        $existing_id = $wpdb->get_var( $wpdb->prepare(
            "SELECT id FROM $table WHERE canvas_course_id = %d AND user_id = %d",
            $data['canvas_course_id'],
            $data['user_id']
        ) );

        if ( $existing_id ) {
            $data['updated_at'] = current_time( 'mysql', true );
            $wpdb->update( $table, $data, array( 'id' => $existing_id ) );
            return (int) $existing_id;
        }

        $result = $wpdb->insert( $table, $data );
        return $result !== false ? (int) $wpdb->insert_id : false;
    }

    /**
     * Insert or update an assignment row.
     *
     * @param array $data Associative array matching plato_assignments columns.
     * @return int|false Inserted/updated row ID, or false on failure.
     */
    public static function insert_assignment( array $data ): int|false {
        global $wpdb;
        $table = $wpdb->prefix . 'plato_assignments';

        $existing_id = $wpdb->get_var( $wpdb->prepare(
            "SELECT id FROM $table WHERE canvas_assignment_id = %d AND user_id = %d",
            $data['canvas_assignment_id'],
            $data['user_id']
        ) );

        if ( $existing_id ) {
            $data['updated_at'] = current_time( 'mysql', true );
            $wpdb->update( $table, $data, array( 'id' => $existing_id ) );
            return (int) $existing_id;
        }

        $result = $wpdb->insert( $table, $data );
        return $result !== false ? (int) $wpdb->insert_id : false;
    }

    /**
     * Get all courses for a user, with assignment counts.
     *
     * @return array Array of course objects with assignment_count appended.
     */
    public static function get_courses_for_user( int $user_id ): array {
        global $wpdb;
        $courses_table     = $wpdb->prefix . 'plato_courses';
        $assignments_table = $wpdb->prefix . 'plato_assignments';

        return $wpdb->get_results( $wpdb->prepare(
            "SELECT c.*, COUNT(a.id) AS assignment_count
             FROM $courses_table c
             LEFT JOIN $assignments_table a ON a.plato_course_id = c.id AND a.user_id = c.user_id
             WHERE c.user_id = %d
             GROUP BY c.id
             ORDER BY c.name ASC",
            $user_id
        ) );
    }

    /**
     * Get assignments for a user, with optional filters.
     *
     * @param array $args {
     *     @type int  $course_id Plato course ID to filter by.
     *     @type bool $upcoming  If true, only return assignments with due_at >= NOW().
     *     @type int  $limit     Max results (default 50, max 100).
     * }
     * @return array Array of assignment objects.
     */
    public static function get_assignments_for_user( int $user_id, array $args = array() ): array {
        global $wpdb;
        $assignments_table = $wpdb->prefix . 'plato_assignments';
        $courses_table     = $wpdb->prefix . 'plato_courses';

        $where  = array( 'a.user_id = %d' );
        $params = array( $user_id );

        if ( ! empty( $args['course_id'] ) ) {
            $where[]  = 'a.plato_course_id = %d';
            $params[] = (int) $args['course_id'];
        }

        if ( ! empty( $args['upcoming'] ) ) {
            $where[] = 'a.due_at >= %s';
            $params[] = current_time( 'mysql', true );
        }

        $limit = min( isset( $args['limit'] ) ? absint( $args['limit'] ) : 50, 100 );

        $where_clause = implode( ' AND ', $where );

        return $wpdb->get_results( $wpdb->prepare(
            "SELECT a.*, c.name AS course_name, c.course_code
             FROM $assignments_table a
             INNER JOIN $courses_table c ON c.id = a.plato_course_id
             WHERE $where_clause
             ORDER BY a.due_at ASC
             LIMIT %d",
            array_merge( $params, array( $limit ) )
        ) );
    }

    /**
     * Delete all courses and assignments for a user (used on Canvas disconnect).
     */
    public static function delete_courses_for_user( int $user_id ): bool {
        global $wpdb;

        $wpdb->delete( $wpdb->prefix . 'plato_assignments', array( 'user_id' => $user_id ) );
        $wpdb->delete( $wpdb->prefix . 'plato_courses', array( 'user_id' => $user_id ) );

        return true;
    }

    // ─── Conversations CRUD ──────────────────────────────────────────────────

    public static function create_conversation( int $user_id, string $title, ?int $course_id = null, string $mode = 'socratic' ): int|false {
        global $wpdb;

        $result = $wpdb->insert(
            $wpdb->prefix . 'plato_conversations',
            array(
                'user_id'   => $user_id,
                'course_id' => $course_id,
                'title'     => $title,
                'mode'      => $mode,
            )
        );

        return $result !== false ? (int) $wpdb->insert_id : false;
    }

    public static function get_conversations_for_user( int $user_id, int $limit = 20 ): array {
        global $wpdb;
        $table = $wpdb->prefix . 'plato_conversations';
        $courses_table = $wpdb->prefix . 'plato_courses';

        return $wpdb->get_results( $wpdb->prepare(
            "SELECT cv.*, c.name AS course_name, c.course_code
             FROM $table cv
             LEFT JOIN $courses_table c ON c.id = cv.course_id
             WHERE cv.user_id = %d
             ORDER BY cv.updated_at DESC
             LIMIT %d",
            $user_id,
            $limit
        ) );
    }

    public static function get_conversation( int $conversation_id, int $user_id ): object|null {
        global $wpdb;
        $table = $wpdb->prefix . 'plato_conversations';

        return $wpdb->get_row( $wpdb->prepare(
            "SELECT * FROM $table WHERE id = %d AND user_id = %d",
            $conversation_id,
            $user_id
        ) );
    }

    public static function update_conversation_title( int $conversation_id, string $title ): void {
        global $wpdb;
        $wpdb->update(
            $wpdb->prefix . 'plato_conversations',
            array( 'title' => $title, 'updated_at' => current_time( 'mysql', true ) ),
            array( 'id' => $conversation_id )
        );
    }

    public static function delete_conversation( int $conversation_id, int $user_id ): bool {
        global $wpdb;

        // Verify ownership.
        $conv = self::get_conversation( $conversation_id, $user_id );
        if ( ! $conv ) {
            return false;
        }

        $wpdb->delete( $wpdb->prefix . 'plato_messages', array( 'conversation_id' => $conversation_id ) );
        $wpdb->delete( $wpdb->prefix . 'plato_conversations', array( 'id' => $conversation_id ) );

        return true;
    }

    // ─── Messages CRUD ───────────────────────────────────────────────────────

    public static function insert_message( int $conversation_id, string $role, string $content, ?int $tokens_used = null ): int|false {
        global $wpdb;

        $result = $wpdb->insert(
            $wpdb->prefix . 'plato_messages',
            array(
                'conversation_id' => $conversation_id,
                'role'            => $role,
                'content'         => $content,
                'tokens_used'     => $tokens_used,
            )
        );

        if ( $result !== false ) {
            // Touch the conversation's updated_at.
            $wpdb->update(
                $wpdb->prefix . 'plato_conversations',
                array( 'updated_at' => current_time( 'mysql', true ) ),
                array( 'id' => $conversation_id )
            );
            return (int) $wpdb->insert_id;
        }

        return false;
    }

    public static function get_messages( int $conversation_id, int $limit = 50 ): array {
        global $wpdb;
        $table = $wpdb->prefix . 'plato_messages';

        return $wpdb->get_results( $wpdb->prepare(
            "SELECT * FROM $table WHERE conversation_id = %d ORDER BY created_at ASC LIMIT %d",
            $conversation_id,
            $limit
        ) );
    }

    public static function count_messages_last_hour( int $user_id ): int {
        global $wpdb;
        $messages_table = $wpdb->prefix . 'plato_messages';
        $convos_table   = $wpdb->prefix . 'plato_conversations';

        return (int) $wpdb->get_var( $wpdb->prepare(
            "SELECT COUNT(m.id)
             FROM $messages_table m
             INNER JOIN $convos_table cv ON cv.id = m.conversation_id
             WHERE cv.user_id = %d AND m.role = 'user' AND m.created_at >= %s",
            $user_id,
            gmdate( 'Y-m-d H:i:s', time() - 3600 )
        ) );
    }

    // ─── Study Notes CRUD (P3: Document Ingestion) ──────────────────────────

    public static function insert_study_note( array $data ): int|false {
        global $wpdb;
        $result = $wpdb->insert( $wpdb->prefix . 'plato_study_notes', $data );
        return $result !== false ? (int) $wpdb->insert_id : false;
    }

    public static function update_study_note( int $id, array $data ): bool {
        global $wpdb;
        $data['updated_at'] = current_time( 'mysql', true );
        return $wpdb->update( $wpdb->prefix . 'plato_study_notes', $data, array( 'id' => $id ) ) !== false;
    }

    public static function get_study_note( int $id ): object|null {
        global $wpdb;
        $table = $wpdb->prefix . 'plato_study_notes';
        return $wpdb->get_row( $wpdb->prepare( "SELECT * FROM $table WHERE id = %d", $id ) );
    }

    /**
     * Get all uploaded files for a user, grouped by file_name.
     * Returns one row per file with aggregated status info.
     */
    public static function get_study_note_files( int $user_id, ?int $course_id = null ): array {
        global $wpdb;
        $table   = $wpdb->prefix . 'plato_study_notes';
        $courses = $wpdb->prefix . 'plato_courses';

        $where  = array( 'n.user_id = %d' );
        $params = array( $user_id );

        if ( $course_id ) {
            $where[]  = 'n.course_id = %d';
            $params[] = $course_id;
        }

        $where_clause = implode( ' AND ', $where );

        return $wpdb->get_results( $wpdb->prepare(
            "SELECT n.file_name, n.course_id, c.name AS course_name, c.course_code,
                    n.file_type, MAX(n.file_size) AS file_size,
                    MAX(n.total_chunks) AS total_chunks,
                    SUM(CASE WHEN n.status = 'completed' THEN 1 ELSE 0 END) AS completed_chunks,
                    MIN(n.status) AS status,
                    MAX(n.error_message) AS error_message,
                    MIN(n.created_at) AS created_at
             FROM $table n
             INNER JOIN $courses c ON c.id = n.course_id
             WHERE $where_clause
             GROUP BY n.file_name, n.course_id
             ORDER BY MIN(n.created_at) DESC",
            $params
        ) );
    }

    /**
     * Get pending study note chunks for background processing.
     */
    public static function get_pending_notes( int $limit = 10 ): array {
        global $wpdb;
        $table = $wpdb->prefix . 'plato_study_notes';

        return $wpdb->get_results( $wpdb->prepare(
            "SELECT * FROM $table WHERE status = 'pending' ORDER BY created_at ASC LIMIT %d",
            $limit
        ) );
    }

    /**
     * Get concatenated summaries for a course — used for LLM context injection.
     */
    public static function get_notes_summaries_for_course( int $user_id, int $course_id ): array {
        global $wpdb;
        $table = $wpdb->prefix . 'plato_study_notes';

        return $wpdb->get_results( $wpdb->prepare(
            "SELECT summary FROM $table
             WHERE user_id = %d AND course_id = %d AND status = 'completed' AND summary IS NOT NULL
             ORDER BY file_name ASC, chunk_index ASC",
            $user_id,
            $course_id
        ) );
    }

    /**
     * Delete all chunks for a given file + course.
     */
    public static function delete_study_note_file( int $user_id, string $file_name, int $course_id ): bool {
        global $wpdb;
        $table = $wpdb->prefix . 'plato_study_notes';

        // Get file_path before deleting (from chunk 0).
        $file_path = $wpdb->get_var( $wpdb->prepare(
            "SELECT file_path FROM $table WHERE user_id = %d AND file_name = %s AND course_id = %d AND chunk_index = 0",
            $user_id,
            $file_name,
            $course_id
        ) );

        // Delete all chunks.
        $wpdb->query( $wpdb->prepare(
            "DELETE FROM $table WHERE user_id = %d AND file_name = %s AND course_id = %d",
            $user_id,
            $file_name,
            $course_id
        ) );

        // Delete physical file.
        if ( $file_path ) {
            $upload_dir = wp_upload_dir();
            $full_path  = $upload_dir['basedir'] . '/' . $file_path;
            if ( file_exists( $full_path ) ) {
                wp_delete_file( $full_path );
            }
        }

        return true;
    }

    /**
     * Count notes for a course (for chat indicator).
     */
    public static function count_notes_for_course( int $user_id, int $course_id ): int {
        global $wpdb;
        $table = $wpdb->prefix . 'plato_study_notes';

        return (int) $wpdb->get_var( $wpdb->prepare(
            "SELECT COUNT(DISTINCT file_name) FROM $table WHERE user_id = %d AND course_id = %d",
            $user_id,
            $course_id
        ) );
    }

    // ─── Canvas Content Tracking ────────────────────────────────────────

    /**
     * Check if a Canvas content item has already been synced.
     */
    public static function canvas_content_exists( int $user_id, string $content_key ): bool {
        global $wpdb;
        $table = $wpdb->prefix . 'plato_canvas_content';

        return (bool) $wpdb->get_var( $wpdb->prepare(
            "SELECT id FROM $table WHERE user_id = %d AND content_key = %s",
            $user_id,
            $content_key
        ) );
    }

    /**
     * Insert a canvas content tracking record.
     */
    public static function insert_canvas_content( array $data ): int|false {
        global $wpdb;
        $result = $wpdb->insert( $wpdb->prefix . 'plato_canvas_content', $data );
        return $result !== false ? (int) $wpdb->insert_id : false;
    }

    /**
     * Get content sync stats for a user.
     */
    public static function get_canvas_content_stats( int $user_id ): array {
        global $wpdb;
        $table = $wpdb->prefix . 'plato_canvas_content';

        $total = (int) $wpdb->get_var( $wpdb->prepare(
            "SELECT COUNT(*) FROM $table WHERE user_id = %d",
            $user_id
        ) );

        $total_chunks = (int) $wpdb->get_var( $wpdb->prepare(
            "SELECT COALESCE(SUM(chunks_created), 0) FROM $table WHERE user_id = %d",
            $user_id
        ) );

        return array(
            'pages_synced'  => $total,
            'total_chunks'  => $total_chunks,
        );
    }

    /**
     * Get canvas content items for a specific course, grouped by module.
     */
    public static function get_canvas_content_for_course( int $user_id, int $course_id ): array {
        global $wpdb;
        $table = $wpdb->prefix . 'plato_canvas_content';

        return $wpdb->get_results( $wpdb->prepare(
            "SELECT id, content_type, title, module_name, chunks_created, synced_at
             FROM $table
             WHERE user_id = %d AND plato_course_id = %d
             ORDER BY module_name ASC, title ASC",
            $user_id,
            $course_id
        ) );
    }

    /**
     * Get study note content for a specific canvas content item (by file_name pattern).
     */
    public static function get_study_note_content( int $user_id, int $course_id, string $file_name ): array {
        global $wpdb;
        $table = $wpdb->prefix . 'plato_study_notes';

        return $wpdb->get_results( $wpdb->prepare(
            "SELECT chunk_index, content, summary, status
             FROM $table
             WHERE user_id = %d AND course_id = %d AND file_name = %s
             ORDER BY chunk_index ASC",
            $user_id,
            $course_id,
            $file_name
        ) );
    }

    // ─── Training Scenarios CRUD ────────────────────────────────────────────

    public static function insert_training_scenario( array $data ): int|false {
        global $wpdb;
        $result = $wpdb->insert( $wpdb->prefix . 'plato_training_scenarios', $data );
        return $result !== false ? (int) $wpdb->insert_id : false;
    }

    public static function get_training_scenarios( int $user_id, int $course_id, string $module_name ): array {
        global $wpdb;
        $table = $wpdb->prefix . 'plato_training_scenarios';

        return $wpdb->get_results( $wpdb->prepare(
            "SELECT * FROM $table WHERE user_id = %d AND course_id = %d AND module_name = %s ORDER BY scenario_index ASC",
            $user_id,
            $course_id,
            $module_name
        ) );
    }

    public static function get_training_scenario( int $id, int $user_id ): object|null {
        global $wpdb;
        $table = $wpdb->prefix . 'plato_training_scenarios';

        return $wpdb->get_row( $wpdb->prepare(
            "SELECT * FROM $table WHERE id = %d AND user_id = %d",
            $id,
            $user_id
        ) );
    }

    public static function delete_training_scenarios( int $user_id, int $course_id, string $module_name ): bool {
        global $wpdb;
        $table = $wpdb->prefix . 'plato_training_scenarios';

        // Also delete related attempts.
        $scenario_ids = $wpdb->get_col( $wpdb->prepare(
            "SELECT id FROM $table WHERE user_id = %d AND course_id = %d AND module_name = %s",
            $user_id,
            $course_id,
            $module_name
        ) );

        if ( ! empty( $scenario_ids ) ) {
            $ids_placeholder = implode( ',', array_map( 'intval', $scenario_ids ) );
            $wpdb->query( "DELETE FROM {$wpdb->prefix}plato_training_attempts WHERE scenario_id IN ($ids_placeholder)" );
        }

        $wpdb->delete( $table, array(
            'user_id'     => $user_id,
            'course_id'   => $course_id,
            'module_name' => $module_name,
        ) );

        return true;
    }

    // ─── Training Attempts CRUD ─────────────────────────────────────────────

    public static function insert_training_attempt( array $data ): int|false {
        global $wpdb;
        $result = $wpdb->insert( $wpdb->prefix . 'plato_training_attempts', $data );
        return $result !== false ? (int) $wpdb->insert_id : false;
    }

    public static function get_best_attempt( int $user_id, int $scenario_id ): object|null {
        global $wpdb;
        $table = $wpdb->prefix . 'plato_training_attempts';

        return $wpdb->get_row( $wpdb->prepare(
            "SELECT * FROM $table WHERE user_id = %d AND scenario_id = %d ORDER BY score_pct DESC, created_at DESC LIMIT 1",
            $user_id,
            $scenario_id
        ) );
    }

    public static function count_attempts( int $user_id, int $scenario_id ): int {
        global $wpdb;
        $table = $wpdb->prefix . 'plato_training_attempts';

        return (int) $wpdb->get_var( $wpdb->prepare(
            "SELECT COUNT(*) FROM $table WHERE user_id = %d AND scenario_id = %d",
            $user_id,
            $scenario_id
        ) );
    }

    public static function get_module_mastery( int $user_id, int $course_id, string $module_name ): array {
        global $wpdb;
        $scenarios_table = $wpdb->prefix . 'plato_training_scenarios';
        $attempts_table  = $wpdb->prefix . 'plato_training_attempts';

        $scenarios = $wpdb->get_results( $wpdb->prepare(
            "SELECT s.id,
                    MAX(a.score_pct) AS best_score,
                    MAX(a.passed) AS ever_passed,
                    COUNT(a.id) AS attempt_count
             FROM $scenarios_table s
             LEFT JOIN $attempts_table a ON a.scenario_id = s.id AND a.user_id = s.user_id
             WHERE s.user_id = %d AND s.course_id = %d AND s.module_name = %s
             GROUP BY s.id
             ORDER BY s.scenario_index ASC",
            $user_id,
            $course_id,
            $module_name
        ) );

        $total     = count( $scenarios );
        $passed    = 0;
        foreach ( $scenarios as $s ) {
            if ( (int) $s->ever_passed === 1 ) {
                $passed++;
            }
        }

        return array(
            'total_scenarios'  => $total,
            'passed_scenarios' => $passed,
            'mastered'         => $total > 0 && $passed === $total,
            'scenarios'        => $scenarios,
        );
    }

    public static function get_training_modules_for_course( int $user_id, int $course_id ): array {
        global $wpdb;
        $canvas_table    = $wpdb->prefix . 'plato_canvas_content';
        $scenarios_table = $wpdb->prefix . 'plato_training_scenarios';
        $attempts_table  = $wpdb->prefix . 'plato_training_attempts';

        // Get modules with page counts from canvas content.
        $modules = $wpdb->get_results( $wpdb->prepare(
            "SELECT module_name, COUNT(*) AS page_count
             FROM $canvas_table
             WHERE user_id = %d AND plato_course_id = %d AND module_name != ''
             GROUP BY module_name
             ORDER BY module_name ASC",
            $user_id,
            $course_id
        ) );

        $result = array();
        foreach ( $modules as $mod ) {
            $mastery = self::get_module_mastery( $user_id, $course_id, $mod->module_name );
            $result[] = array(
                'module_name'       => $mod->module_name,
                'page_count'        => (int) $mod->page_count,
                'total_scenarios'   => $mastery['total_scenarios'],
                'passed_scenarios'  => $mastery['passed_scenarios'],
                'mastered'          => $mastery['mastered'],
            );
        }

        return $result;
    }

    /**
     * Get module content chunks for scenario generation.
     */
    public static function get_module_content_for_training( int $user_id, int $course_id, string $module_name ): string {
        global $wpdb;
        $canvas_table = $wpdb->prefix . 'plato_canvas_content';
        $notes_table  = $wpdb->prefix . 'plato_study_notes';

        // Get file_names for this module's content.
        $content_items = $wpdb->get_results( $wpdb->prepare(
            "SELECT title, content_key
             FROM $canvas_table
             WHERE user_id = %d AND plato_course_id = %d AND module_name = %s
             ORDER BY title ASC",
            $user_id,
            $course_id,
            $module_name
        ) );

        $all_content = '';
        foreach ( $content_items as $item ) {
            // Study notes are stored with file_name matching the content_key pattern.
            $chunks = $wpdb->get_results( $wpdb->prepare(
                "SELECT content FROM $notes_table
                 WHERE user_id = %d AND course_id = %d AND file_name LIKE %s AND status = 'completed'
                 ORDER BY chunk_index ASC",
                $user_id,
                $course_id,
                '%' . $wpdb->esc_like( $item->title ) . '%'
            ) );

            foreach ( $chunks as $chunk ) {
                if ( $chunk->content ) {
                    $all_content .= $chunk->content . "\n\n";
                }
            }
        }

        // Cap at ~12000 chars.
        if ( mb_strlen( $all_content ) > 12000 ) {
            $all_content = mb_substr( $all_content, 0, 12000 ) . "\n\n... (content truncated)";
        }

        return trim( $all_content );
    }

    // ─── Dashboard Stats ────────────────────────────────────────────────────

    /**
     * Get aggregated dashboard stats for a user.
     * Runs separate queries to avoid JOIN multiplication.
     */
    public static function get_dashboard_stats( int $user_id ): array {
        global $wpdb;

        $courses_t       = $wpdb->prefix . 'plato_courses';
        $assignments_t   = $wpdb->prefix . 'plato_assignments';
        $conversations_t = $wpdb->prefix . 'plato_conversations';
        $messages_t      = $wpdb->prefix . 'plato_messages';
        $notes_t         = $wpdb->prefix . 'plato_study_notes';
        $canvas_t        = $wpdb->prefix . 'plato_canvas_content';
        $now             = current_time( 'mysql', true );
        $week_ago        = gmdate( 'Y-m-d H:i:s', time() - 7 * 86400 );

        // 1. Course overview
        $course_row = $wpdb->get_row( $wpdb->prepare(
            "SELECT
                COUNT(*) AS total_courses,
                SUM(CASE WHEN workflow_state = 'available' THEN 1 ELSE 0 END) AS active_courses,
                SUM(CASE WHEN workflow_state = 'completed' THEN 1 ELSE 0 END) AS concluded_courses
             FROM $courses_t WHERE user_id = %d",
            $user_id
        ) );

        // 2. Assignment overview
        $assign_row = $wpdb->get_row( $wpdb->prepare(
            "SELECT
                COUNT(*) AS total_assignments,
                SUM(CASE WHEN due_at >= %s AND due_at <= %s THEN 1 ELSE 0 END) AS upcoming_assignments,
                SUM(CASE WHEN due_at < %s THEN 1 ELSE 0 END) AS overdue_assignments
             FROM $assignments_t WHERE user_id = %d",
            $now,
            gmdate( 'Y-m-d H:i:s', time() + 7 * 86400 ),
            $now,
            $user_id
        ) );

        // 3. Conversation aggregate
        $convo_row = $wpdb->get_row( $wpdb->prepare(
            "SELECT
                COUNT(*) AS total_conversations,
                SUM(CASE WHEN mode = 'socratic' THEN 1 ELSE 0 END) AS socratic_conversations,
                SUM(CASE WHEN mode = 'eli5' THEN 1 ELSE 0 END) AS eli5_conversations,
                SUM(CASE WHEN created_at >= %s THEN 1 ELSE 0 END) AS conversations_this_week
             FROM $conversations_t WHERE user_id = %d",
            $week_ago,
            $user_id
        ) );

        // 4. Message aggregate (user messages only)
        $msg_row = $wpdb->get_row( $wpdb->prepare(
            "SELECT
                COUNT(*) AS total_messages,
                SUM(CASE WHEN m.created_at >= %s THEN 1 ELSE 0 END) AS messages_this_week
             FROM $messages_t m
             INNER JOIN $conversations_t cv ON cv.id = m.conversation_id
             WHERE cv.user_id = %d AND m.role = 'user'",
            $week_ago,
            $user_id
        ) );

        $avg_msgs = 0;
        $total_convos = (int) $convo_row->total_conversations;
        $total_msgs   = (int) $msg_row->total_messages;
        if ( $total_convos > 0 ) {
            $avg_msgs = round( $total_msgs / $total_convos, 1 );
        }

        // 5. Streak — consecutive days with at least one message
        $active_dates = $wpdb->get_col( $wpdb->prepare(
            "SELECT DISTINCT DATE(m.created_at) AS d
             FROM $messages_t m
             INNER JOIN $conversations_t cv ON cv.id = m.conversation_id
             WHERE cv.user_id = %d AND m.role = 'user'
             ORDER BY d DESC",
            $user_id
        ) );

        $streak = 0;
        $check_date = gmdate( 'Y-m-d' );
        foreach ( $active_dates as $d ) {
            if ( $d === $check_date ) {
                $streak++;
                $check_date = gmdate( 'Y-m-d', strtotime( $check_date . ' -1 day' ) );
            } else {
                // Allow yesterday to start the streak if today has no messages yet
                if ( $streak === 0 && $d === gmdate( 'Y-m-d', strtotime( $check_date . ' -1 day' ) ) ) {
                    $streak++;
                    $check_date = gmdate( 'Y-m-d', strtotime( $d . ' -1 day' ) );
                } else {
                    break;
                }
            }
        }

        // 6. Knowledge base
        $canvas_stats = self::get_canvas_content_stats( $user_id );

        $notes_row = $wpdb->get_row( $wpdb->prepare(
            "SELECT
                COUNT(DISTINCT file_name) AS study_notes_uploaded,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS study_notes_processed,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS study_notes_pending
             FROM $notes_t WHERE user_id = %d",
            $user_id
        ) );

        // 7. Per-course stats — separate subqueries merged by course_id
        $all_courses = $wpdb->get_results( $wpdb->prepare(
            "SELECT id, name, course_code, workflow_state FROM $courses_t WHERE user_id = %d ORDER BY name ASC",
            $user_id
        ) );

        $course_ids = wp_list_pluck( $all_courses, 'id' );
        $course_stats = array();

        if ( ! empty( $course_ids ) ) {
            $ids_placeholder = implode( ',', array_map( 'intval', $course_ids ) );

            // Assignments per course
            $assign_counts = $wpdb->get_results(
                "SELECT plato_course_id AS course_id,
                    COUNT(*) AS assignment_count,
                    SUM(CASE WHEN due_at >= '{$now}' AND due_at <= '" . gmdate( 'Y-m-d H:i:s', time() + 7 * 86400 ) . "' THEN 1 ELSE 0 END) AS upcoming_count,
                    SUM(CASE WHEN due_at < '{$now}' THEN 1 ELSE 0 END) AS overdue_count
                 FROM $assignments_t
                 WHERE plato_course_id IN ($ids_placeholder)
                 GROUP BY plato_course_id",
                OBJECT_K
            );

            // Conversations per course
            $convo_counts = $wpdb->get_results(
                "SELECT course_id,
                    COUNT(*) AS conversation_count
                 FROM $conversations_t
                 WHERE course_id IN ($ids_placeholder)
                 GROUP BY course_id",
                OBJECT_K
            );

            // Messages per course
            $msg_counts = $wpdb->get_results(
                "SELECT cv.course_id,
                    COUNT(m.id) AS message_count
                 FROM $messages_t m
                 INNER JOIN $conversations_t cv ON cv.id = m.conversation_id
                 WHERE cv.course_id IN ($ids_placeholder) AND m.role = 'user'
                 GROUP BY cv.course_id",
                OBJECT_K
            );

            // Notes per course
            $note_counts = $wpdb->get_results(
                "SELECT course_id,
                    COUNT(DISTINCT file_name) AS notes_count
                 FROM $notes_t
                 WHERE course_id IN ($ids_placeholder)
                 GROUP BY course_id",
                OBJECT_K
            );

            // Canvas pages per course
            $canvas_counts = $wpdb->get_results(
                "SELECT plato_course_id AS course_id,
                    COUNT(*) AS canvas_pages
                 FROM $canvas_t
                 WHERE plato_course_id IN ($ids_placeholder)
                 GROUP BY plato_course_id",
                OBJECT_K
            );

            // Last activity per course (most recent message)
            $last_activity = $wpdb->get_results(
                "SELECT cv.course_id,
                    MAX(m.created_at) AS last_activity
                 FROM $messages_t m
                 INNER JOIN $conversations_t cv ON cv.id = m.conversation_id
                 WHERE cv.course_id IN ($ids_placeholder)
                 GROUP BY cv.course_id",
                OBJECT_K
            );

            foreach ( $all_courses as $c ) {
                $cid = (int) $c->id;
                $course_stats[] = array(
                    'course_id'          => $cid,
                    'course_name'        => $c->name,
                    'course_code'        => $c->course_code,
                    'workflow_state'     => $c->workflow_state,
                    'assignment_count'   => (int) ( $assign_counts[ $cid ]->assignment_count ?? 0 ),
                    'upcoming_count'     => (int) ( $assign_counts[ $cid ]->upcoming_count ?? 0 ),
                    'overdue_count'      => (int) ( $assign_counts[ $cid ]->overdue_count ?? 0 ),
                    'conversation_count' => (int) ( $convo_counts[ $cid ]->conversation_count ?? 0 ),
                    'message_count'      => (int) ( $msg_counts[ $cid ]->message_count ?? 0 ),
                    'notes_count'        => (int) ( $note_counts[ $cid ]->notes_count ?? 0 ),
                    'canvas_pages'       => (int) ( $canvas_counts[ $cid ]->canvas_pages ?? 0 ),
                    'last_activity'      => $last_activity[ $cid ]->last_activity ?? null,
                );
            }
        }

        // 8. Activity timeline — last 14 days
        $fourteen_days_ago = gmdate( 'Y-m-d', time() - 14 * 86400 );
        $timeline_raw = $wpdb->get_results( $wpdb->prepare(
            "SELECT DATE(m.created_at) AS date,
                COUNT(m.id) AS messages,
                COUNT(DISTINCT m.conversation_id) AS conversations
             FROM $messages_t m
             INNER JOIN $conversations_t cv ON cv.id = m.conversation_id
             WHERE cv.user_id = %d AND m.role = 'user' AND DATE(m.created_at) >= %s
             GROUP BY DATE(m.created_at)
             ORDER BY date ASC",
            $user_id,
            $fourteen_days_ago
        ), OBJECT_K );

        // Zero-fill missing days
        $timeline = array();
        for ( $i = 13; $i >= 0; $i-- ) {
            $date = gmdate( 'Y-m-d', time() - $i * 86400 );
            $timeline[] = array(
                'date'          => $date,
                'messages'      => (int) ( $timeline_raw[ $date ]->messages ?? 0 ),
                'conversations' => (int) ( $timeline_raw[ $date ]->conversations ?? 0 ),
            );
        }

        return array(
            'overview' => array(
                'total_courses'        => (int) $course_row->total_courses,
                'active_courses'       => (int) $course_row->active_courses,
                'concluded_courses'    => (int) $course_row->concluded_courses,
                'total_assignments'    => (int) $assign_row->total_assignments,
                'upcoming_assignments' => (int) $assign_row->upcoming_assignments,
                'overdue_assignments'  => (int) $assign_row->overdue_assignments,
            ),
            'engagement' => array(
                'total_conversations'           => $total_convos,
                'total_messages'                => $total_msgs,
                'socratic_conversations'        => (int) $convo_row->socratic_conversations,
                'eli5_conversations'            => (int) $convo_row->eli5_conversations,
                'conversations_this_week'       => (int) $convo_row->conversations_this_week,
                'messages_this_week'            => (int) $msg_row->messages_this_week,
                'avg_messages_per_conversation' => $avg_msgs,
                'streak_days'                   => $streak,
            ),
            'knowledge_base' => array(
                'canvas_pages_synced'    => $canvas_stats['pages_synced'],
                'canvas_total_chunks'    => $canvas_stats['total_chunks'],
                'study_notes_uploaded'   => (int) $notes_row->study_notes_uploaded,
                'study_notes_processed'  => (int) $notes_row->study_notes_processed,
                'study_notes_pending'    => (int) $notes_row->study_notes_pending,
            ),
            'course_stats'      => $course_stats,
            'activity_timeline' => $timeline,
            'generated_at'      => gmdate( 'c' ),
        );
    }
}
