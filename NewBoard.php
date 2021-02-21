<?php
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        if (isset($_POST['board'])) {
            // echo shell_exec('which python3');
            // echo shell_exec('python3 generate_board_data.py 10 -V 2>&1');

            // To give php permission to write to board.json on the server, you can do
            // sudo chown www-data:www-data board.json
            $fp = fopen("board.json", "r+");
            flock($fp, LOCK_EX);
            $file_contents = fread($fp, filesize("board.json"));
            $json = json_decode($file_contents, true);
            if ($json['board'] == $_POST['board']) {
                // echo shell_exec('cat board.json');
                ftruncate($fp, 0);

                // -V 2>&1 redirects python error messages to php
                $new_board_data = shell_exec('python3 generate_board_data.py 10 -V 2>&1');
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
