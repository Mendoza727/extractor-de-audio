const express = require("express");
const fs = require("fs");
const app = express();
const path = require("path");

const axios = require("axios");
const { URL } = require("url");
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath("C:/Users/juanc/Downloads/ffmpeg-master-latest-win64-gpl/bin/ffmpeg.exe");

const { exec } = require('child_process');

app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.json({ limit: "50mb" }));
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Credentials", "true");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    );
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT");
    res.set("Content-Type", "text/html");
    next();
});

app.post('/', async (req, res) => {
    const { videos_url } = req.body;

    const audioDirectory = path.join(__dirname, 'mp3');

    if (!fs.existsSync(audioDirectory)) {
        fs.mkdirSync(audioDirectory);
    }

    const audioFiles = [];
    const length = videos_url.length;

    for (const videoUrl of videos_url) {
        const videoInfo = await ytdl.getInfo(videoUrl);
        const titleVideo = videoInfo.videoDetails.title

        const cleanTitleVideo = cleanTitle(titleVideo);
        const audioFile = `audio_${cleanTitleVideo}.mp3`;

        const destinationPath = path.join(audioDirectory, audioFile);

        try {
            await downloadAudio(videoUrl, destinationPath);
            
            
            /* verificamos que no exista el archivo */
            if (!fs.existsSync(destinationPath)) {
                audioFiles.push(destinationPath);
            } else {
                /* si existe pasamos al siguiente */
                console.log(`El archivo ${destinationPath} ya existe`);
            }
        } catch (err) {
            console.error(err);
            res.status(500).send('Error al descargar el audio');
            return;
        }
    }

    // Descargar el audio del video de YouTube y guardar en el archivo destinationPath
    // ytdl(videoUrl, { filter: 'audioonly' })
    //     .pipe(fs.createWriteStream(destinationPath))
    //     .on('finish', () => {
    //         console.log('Audio descargado y guardado en', destinationPath);
    //         // Aquí puedes enviar una respuesta al cliente si lo deseas
    //         res.status(200).send('Audio descargado y guardado');
    //     })
    //     .on('error', (err) => {
    //         console.error('Error al descargar el audio:', err);
    //         // Aquí puedes enviar una respuesta de error al cliente si ocurre un problema
    //         res.status(500).send('Error al descargar el audio');
    //     });

    res.status(200).send({
        status: "success",
        message: "Audio descargado y guardado",
        totalAudios: "se descargaron: " + length + " audios",
    }).end();

});

function cleanTitle(title) {
    // Reemplazar espacios y caracteres especiales con guiones bajos
    return title.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
}

async function downloadAudio(videoUrl, destinationPath) {
    return new Promise((resolve, reject) => {
        ytdl(videoUrl, { filter: 'audioonly' })
            .pipe(fs.createWriteStream(destinationPath))
            .on('finish', () => {
                console.log(`Audio descargado y guardado en ${destinationPath}`);
                resolve();
            })
            .on('error', (err) => {
                console.error(`Error al descargar el audio de ${videoUrl}: ${err}`);
                reject(err);
            });
    });
}

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
    console.log(`Iniciamos en el puerto ${PORT}`);
    console.log("Ctrl + C Para reiniciar consola");
});

process.on("unhandledRejection", (err) => {
    console.error(err);
    throw err;
});
