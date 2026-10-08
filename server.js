"use strict";

const path = require("path");
const express = require("express");
const cors = require("cors");
const os = require("os");
const apiRoutes = require("./routes/api");

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// Función para obtener la IP local de la computadora
function getLocalIP(){
    const interfaces = os.networkInterfaces();
    for(const name of Object.keys(interfaces)){
        for(const iface of interfaces[name]){
            if(iface.family === 'IPv4' && !iface.internal){
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
}

const localIP = getLocalIP();
const frontendPath = path.join(__dirname, "public");

// Middlewares
app.disable("x-powered-by");
app.use(cors());
app.use(express.json({ limit: "32kb" }));

app.use(express.static(frontendPath));

app.use("/api", apiRoutes);

// Ruta principal: al entrar a http://localhost:3000, sirve directamente el index.html
app.get("/", (_req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
});

app.use((req, res) => {
    if (req.path.startsWith("/api/")) {
        return res.status(404).json({ ok: false, mensaje: "Ruta API no encontrada." });
    }
    return res.status(404).sendFile(path.join(frontendPath, "index.html"));
});

app.use((err, _req, res, _next) => {
    console.error("Error controlado:", err.message);
    if (err instanceof SyntaxError && "body" in err) {
        return res.status(400).json({ ok: false, mensaje: "JSON inválido." });
    }
    return res.status(500).json({ ok: false, mensaje: "Ocurrió un error interno controlado." });
});

app.listen(PORT, HOST, () => {
    console.log('\n=============================================');
    console.log(' Servidor H&O ejecutándose correctamente');
    console.log('=============================================');
    console.log(`Local:      http://localhost:${PORT}`);
    console.log(`Red Local:  http://${localIP}:${PORT}`);
    console.log('---------------------------------------------\n');
});