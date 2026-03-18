const express = require('express');
const cors = require('cors');
const { Readable } = require('stream');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use(express.static('./public'));

let yt = null;

// create innertube once
async function getYT() {
    if (!yt) {
        const { Innertube, Platform } = await import('youtubei.js');

        Platform.shim.eval = async (data, env) => {
            const code = `${data.output}
            return {
                n: exportedVars.nFunction?.("${env.n || ''}"),
                sig: exportedVars.sigFunction?.("${env.sig || ''}")
            }`;
            return new Function(code)();
        };

        yt = await Innertube.create();
    }
    return yt;
}

// simple validation
function getId(url) {
    try {
        const u = new URL(url);
        if (u.hostname === 'youtu.be') return u.pathname.slice(1);
        if (u.pathname.startsWith('/shorts/')) return u.pathname.split('/')[2];
        return u.searchParams.get('v');
    } catch {
        return null;
    }
}

// VIDEO INFO
app.get('/video-info', async (req, res) => {
    const id = getId(req.query.url);
    if (!id) return res.status(400).json({ success: false, error: 'Invalid URL' });

    try {
        const y = await getYT();
        const info = await y.getBasicInfo(id);

        const title = info.basic_info.title;
        const thumbnail = info.basic_info.thumbnail?.[0]?.url || '';

        const formats = [
            ...(info.streaming_data?.formats || []),
            ...(info.streaming_data?.adaptive_formats || [])
        ]
            .filter(f => f.mime_type?.includes('mp4') && f.has_audio && f.has_video)
            .map(f => ({
                quality: f.quality_label || `${f.height}p`,
                itag: f.itag
            }))
            .filter((v, i, a) =>
                a.findIndex(t => t.quality === v.quality) === i
            )
            .sort((a, b) => parseInt(b.quality) - parseInt(a.quality));

        res.json({ success: true, title, thumbnail, formats });
    } catch (e) {
        res.status(500).json({ success: false, error: 'Cannot fetch video info' });
    }
});

// DOWNLOAD
app.get('/download', async (req, res) => {
    const id = getId(req.query.url);
    const itag = parseInt(req.query.itag);

    if (!id || !itag) return res.status(400).send('Invalid request');

    try {
        const y = await getYT();
        const info = await y.getBasicInfo(id);

        const title = (info.basic_info.title || 'video')
            .replace(/[^\w\s-]/g, '');

        res.header('Content-Disposition', `attachment; filename="${title}.mp4"`);
        res.header('Content-Type', 'video/mp4');

        const stream = await info.download({ itag, type: 'video+audio' });
        Readable.fromWeb(stream).pipe(res);

    } catch (e) {
        res.status(500).send('Download error');
    }
});

app.listen(PORT, () =>
    console.log(`Server running → http://localhost:${PORT}`)
);