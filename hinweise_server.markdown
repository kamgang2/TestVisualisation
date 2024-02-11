
 Middleware im Kontext eines Express-Webservers:

const express = require('express');: Importiert die Express-Bibliothek, die es ermöglicht, einen Webserver einfach zu erstellen und zu verwalten.

const fs = require('fs');: Importiert die FileSystem-Bibliothek, die den Zugriff auf das Dateisystem des Servers ermöglicht, in diesem Fall für das Lesen und Schreiben von Dateien.

const cors = require('cors');: Importiert die CORS (Cross-Origin Resource Sharing)-Bibliothek. CORS ist ein Sicherheitsmechanismus, der Webseiten in einem Browser verbietet, Ressourcen von einem anderen Ursprung als dem, der die Seite serviert, zu laden. Die cors-Middleware ermöglicht es, diese Beschränkungen zu umgehen und Anfragen von anderen Ursprüngen zuzulassen.

const bodyParser = require('body-parser');: Importiert die Body-Parser-Bibliothek. Express liest standardmäßig nicht den Körper von HTTP-POST-Anforderungen. Der Body Parser analysiert den Körper der Anforderung und macht die darin enthaltenen Daten als JSON-Objekt verfügbar. Das ist besonders nützlich, wenn Daten in einem POST-Request gesendet werden, da sie dann leichter vom Server verarbeitet werden können.

const app = express();: Erstellt eine Express-Anwendung, die die zentrale Struktur für das Erstellen eines Webservers darstellt.

const port = 3000;: Setzt den Port, auf dem der Server lauscht. In diesem Fall ist es Port 3000.

app.use(express.static('public'));: Teilt Express mit, dass statische Dateien (wie HTML, CSS, JavaScript) aus dem Ordner "public" bereitgestellt werden sollen. Dies ist nützlich, wenn du beispielsweise Frontend-Dateien (Client-seitige Dateien) in einem Ordner bereitstellen möchtest.

app.use(express.json());: Teilt Express mit, JSON-Anforderungsbodies zu parsen. Das ermöglicht es dem Server, JSON-Daten in Anfragen zu lesen.

app.use(cors());: Aktiviert die CORS-Middleware für die Anwendung. Dies ist wichtig, wenn deine Anwendung Anfragen von verschiedenen Domains oder Ports akzeptieren soll.

app.use(bodyParser.json());: Verwendet den Body Parser für JSON-Requests. Damit können Daten aus dem Körper von HTTP-Anfragen gelesen werden.
