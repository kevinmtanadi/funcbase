package pkg_backup

import (
	"context"
	"database/sql"
	"fmt"
	"funcbase/constants"
	"time"

	"github.com/mattn/go-sqlite3"
)

func Backup(srcPath, backupPath string) error {
	sourceDB, _ := sql.Open("sqlite3", srcPath)
	defer sourceDB.Close()

	backupFilename := fmt.Sprintf("%s/backup-%s.sqlite", backupPath, time.Now().Format("2006-01-02_15-04-05"))
	destDB, _ := sql.Open("sqlite3", backupFilename)
	defer destDB.Close()

	sourceConn, _ := sourceDB.Conn(context.Background())
	destConn, _ := destDB.Conn(context.Background())
	defer sourceConn.Close()
	defer destConn.Close()

	err := sourceConn.Raw(func(sourceRawConnection any) error {
		return destConn.Raw(func(destinationRawConnection any) error {
			sourceSqliteConn, ok := sourceRawConnection.(*sqlite3.SQLiteConn)
			if !ok {
				return fmt.Errorf("error when casting source raw connection to sqlite connection")
			}

			destSqliteConn, ok := destinationRawConnection.(*sqlite3.SQLiteConn)
			if !ok {
				return fmt.Errorf("error when casting source raw connection to sqlite connection")
			}

			return backup(sourceSqliteConn, destSqliteConn)
		})
	})

	return err
}

func Restore(backupPath, targetPath string) error {
	backupFilename := fmt.Sprintf("%s/%s/%s", constants.DATA_PATH, constants.BACKUP_PATH, backupPath)
	backupDB, _ := sql.Open("sqlite3", backupFilename)
	defer backupDB.Close()
	targetDB, _ := sql.Open("sqlite3", targetPath)
	defer targetDB.Close()

	sourceConn, _ := backupDB.Conn(context.Background())
	defer sourceConn.Close()
	destConn, _ := targetDB.Conn(context.Background())
	defer destConn.Close()

	err := sourceConn.Raw(func(sourceRawConnection any) error {
		return destConn.Raw(func(destinationRawConnection any) error {
			sourceSqliteConn, ok := sourceRawConnection.(*sqlite3.SQLiteConn)
			if !ok {
				return fmt.Errorf("error when casting source raw connection to sqlite connection")
			}

			destSqliteConn, ok := destinationRawConnection.(*sqlite3.SQLiteConn)
			if !ok {
				return fmt.Errorf("error when casting source raw connection to sqlite connection")
			}

			return backup(sourceSqliteConn, destSqliteConn)
		})
	})

	return err
}

func backup(source, dest *sqlite3.SQLiteConn) error {
	b, err := dest.Backup("main", source, "main")
	if err != nil {
		return fmt.Errorf("error initializing SQLite backup: %w", err)
	}

	// using -1, sqlite perform a backup of the entire database.
	// using a positive integer instead, tells sqlite to copy only a specific number of pages and pause the lock.
	// in that case, a loop that continues to call step and checks for done flag in necessary
	done, err := b.Step(-1)
	if !done {
		// it should never happen when using -1 as step
		return fmt.Errorf("generic error: backup is not done after step")
	}
	if err != nil {
		return fmt.Errorf("error in stepping backup: %w", err)
	}

	// remember to call finish to clear up resources
	err = b.Finish()
	if err != nil {
		return fmt.Errorf("error finishing backup: %w", err)
	}

	//yup :) we backup our sqlite database
	return nil
}
