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
}
