<?php
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        if (isset($_POST['board'])) {
            $fp = fopen("board.json", "r+");
            flock($fp, LOCK_EX);
            $file_contents = fread($fp, filesize("board.json"));
            $json = json_decode($file_contents, true);
            if ($json['board'] == $_POST['board']) {
                ftruncate($fp, 0);
                shell_exec('python3 generate_board_data.py 10 > board.json');
                $new_board_data = shell_exec('cat board.json');
                rewind($fp);
                fwrite($fp, $new_board_data);
            } else {
                $new_board_data = $file_contents;
            }
            flock($fp, LOCK_UN);
            fclose($fp);
            echo $new_board_data;
        } else {
            echo shell_exec('cat board.json');
        }
    } else if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        echo shell_exec('cat board.json');
    }
?>
