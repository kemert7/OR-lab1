const express = require('express')
const app = express()
const port = 3000
const { Client } = require("pg")
const dotenv = require("dotenv")
dotenv.config()

app.use(express.static(__dirname + '/public'));
app.set('views',__dirname+'/public');
app.engine('html',require('ejs').renderFile);
app.set('view engine', 'html');

const client = new Client({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT
})
client.connect();

app.get('/', (req, res) => {
    return res.render('index');
})
app.get('/datatable', (req, res) => {
    return res.render('datatable');
})

app.get('/json', (req, res) => {
    return res.download('topAlbums.json');
})
app.get('/csv', (req, res) => {
    return res.download('topAlbums.csv');
})
app.get('/topAlbums', (req, res) => {
    client.query('SELECT * FROM albums', function(err, result){
        if(err){
            console.log(err);
            res.status(400).send(err);
        }
        const table={data:result.rows}
        return res.json(table);
    });
})


app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`)
})