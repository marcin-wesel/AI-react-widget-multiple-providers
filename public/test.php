<?php
// Wyłącz buforowanie PHP
ini_set('output_buffering', 'off');
ini_set('zlib.output_compression', false);
while (ob_get_level()) ob_end_flush();
ob_implicit_flush(true);

header('Content-Type: text/plain');
header('X-Accel-Buffering: no'); // Dla Nginx

echo "Start...\n";
flush();

for ($i = 0; $i < 5; $i++) {
    sleep(1);
    echo "Sekunda $i\n";
    flush();
}
echo "Koniec.";