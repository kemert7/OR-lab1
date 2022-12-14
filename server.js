const express = require('express')
const app = express()
const port = 3000
const { Client } = require("pg")
const dotenv = require("dotenv")
dotenv.config()

app.set('view engine', 'ejs');
/*app.set('views',__dirname+'/views');*/
app.engine('html',require('ejs').renderFile);
app.use(express.static(__dirname + '/public'));

/*app.use(express.static(__dirname + '/public'));
app.set('views',__dirname+'/public');
app.engine('html',require('ejs').renderFile);
app.set('view engine', 'html');*/

const bodyParser = require("body-parser");
app.use(bodyParser.json());

const { readFileSync } = require('fs');
const openApiSpecs = readFileSync('./openapi.json');

const client = new Client({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT
})
client.connect();

const { auth,requiresAuth } = require('express-openid-connect');

const config = {
    authRequired: false,
    auth0Logout: true,
    secret: process.env.SECRET,
    baseURL: 'http://localhost:3000',
    clientID: process.env.CLIENT_ID,
    issuerBaseURL: 'https://dev-zq43djrc.us.auth0.com'
};

// auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(auth(config));

// req.isAuthenticated is provided from the auth router
/*app.get('/', (req, res) => {
    res.send(req.oidc.isAuthenticated() ? 'Logged in' : 'Logged out');
});*/

var user={};

app.get('/',(req, res) => {
    user={
        isAuthenticated: req.oidc.isAuthenticated()
    };
    if(user.isAuthenticated){
        user.name=req.oidc.user.name;
        user.nickname=req.oidc.user.nickname;
        user.picture=req.oidc.user.picture
        user.loggedIn = new Date (req.oidc.user.updated_at).toLocaleString();
        user.email=req.oidc.user.email;
    }
    if(user.isAuthenticated){
        return res.redirect('/frontpage')
    }
    return res.render('index.html');
})
app.get('/frontpage',requiresAuth(),(req, res) => {
    return res.render('frontpage.html');
})
app.get('/profile',requiresAuth(),(req, res) => {
    user={
        isAuthenticated: req.oidc.isAuthenticated()
    };
    if(user.isAuthenticated){
        user.name=req.oidc.user.name;
        user.nickname=req.oidc.user.nickname;
        user.picture=req.oidc.user.picture
        user.loggedIn = new Date (req.oidc.user.updated_at).toLocaleString();
        user.email=req.oidc.user.email;
    }
    return res.render('profile',{user:user});
})
app.get('/datatable', requiresAuth(),(req, res) => {
    return res.render('datatable.html');
})

app.get('/json',requiresAuth(), (req, res) => {
    return res.download('topAlbums.json');
})
app.get('/csv',requiresAuth(), (req, res) => {
    return res.download('topAlbums.csv');
})
app.get('/topAlbums',requiresAuth(), (req, res) => {
    client.query('SELECT * FROM albums', function(err, result){
        if(err){
            console.log(err);
            res.status(400).send(err);
        }
        const table={data:result.rows}
        return res.json(table);
    });
})
/// REST API dohvat svih albuma
app.get('/apiAlbums', (req, res)=>{
    let response=[];
    client.query(`Select * from albums order by positiononlist`, (err, result)=>{
        if(!err){
            for (let key in result.rows) {
                albumObj = {}
                albumObj['@context'] = {
                    "@vocab": "http://schema.org/",
                    "albumname": "https://schema.org/MusicAlbum",
                    "numberoftracks": "https://schema.org/MusicAlbum",
                    "producer": "https://schema.org/Person"

                }

                albumObj['positiononlist'] = result.rows[key].positiononlist
                albumObj['releaseyear'] = result.rows[key].releaseyear
                albumObj['albumname'] =
                    {
                        "@type" :  'MusicAlbum',
                        "name" :result.rows[key].albumname
                    }
                albumObj['artist'] = result.rows[key].artist
                albumObj['genre'] = result.rows[key].genre
                albumObj['producer'] =
                    {
                        "@type" :  'Person',
                        "name": result.rows[key].producer
                    }
                albumObj['studio'] = result.rows[key].studio
                albumObj['albumduration'] = result.rows[key].albumduration
                albumObj['albumlabel'] = result.rows[key].albumlabel
                albumObj['artistscronologyalbumorder'] = result.rows[key].artistscronologyalbumorder
                albumObj['numberoftracks'] = {
                    "@type" :  'MusicAlbum',
                    "numTracks": result.rows[key].numberoftracks
                }
                response.push(albumObj)
            }
            let wrapResponse={
                "status":"OK",
                "message":"Fetched list of all albums",
                "response":response
            }
            res.send(wrapResponse);
        }
        else{
            let wrapResponse={
                "status":"Error",
                "message":err.message,
                "response":null
            }
            res.statusCode=404
            res.send(wrapResponse);
        }
    });
})

///REST API dohvat pojedinog albuma po poretku na listi
app.get('/apiAlbums/:id', (req, res)=>{
    let response=[];
    client.query(`Select * from albums where positiononlist=${req.params.id}`, (err, result)=>{
        if(!err){
            if (result.rows.length>0){
                albumObj = {}
                albumObj['@context'] = {
                    "@vocab": "http://schema.org/",
                    "albumname": "https://schema.org/MusicAlbum",
                    "numberoftracks": "https://schema.org/MusicAlbum",
                    "producer": "https://schema.org/Person"

                }

                albumObj['positiononlist'] = result.rows[0].positiononlist
                albumObj['releaseyear'] = result.rows[0].releaseyear
                albumObj['albumname'] =
                    {
                        "@type" :  'MusicAlbum',
                        "name" :result.rows[0].albumname
                    }
                albumObj['artist'] = result.rows[0].artist
                albumObj['genre'] = result.rows[0].genre
                albumObj['producer'] =
                    {
                        "@type" :  'Person',
                        "name": result.rows[0].producer
                    }
                albumObj['studio'] = result.rows[0].studio
                albumObj['albumduration'] = result.rows[0].albumduration
                albumObj['albumlabel'] = result.rows[0].albumlabel
                albumObj['artistscronologyalbumorder'] = result.rows[0].artistscronologyalbumorder
                albumObj['numberoftracks'] = {
                    "@type" :  'MusicAlbum',
                    "numTracks": result.rows[0].numberoftracks
                }
                response.push(albumObj)
                let wrapResponse = {
                    "status": "OK",
                    "message": "Fetched requested album by id " + req.params.id,
                    "response": response
                }
                res.send(wrapResponse);
            }
            else{
                let wrapResponse = {
                    "status": "Not Found",
                    "message": "Album with id " + req.params.id + " does not exist",
                    "response": null
                }
                res.statusCode=400
                res.send(wrapResponse);
            }
        }
        else{
            let wrapResponse={
                "status":"Error",
                "message":err.message,
                "response":null
            }
            res.statusCode=404
            res.send(wrapResponse);
        }
    });
});
///REST API dohvat po izvodjacu
app.get('/apiAlbums/artist/:artist', (req, res)=>{
    client.query(`Select * from albums where artist='${req.params.artist}'`, (err, result)=>{
        if(!err){
            if (result.rows.length>0){
                let wrapResponse = {
                    "status": "OK",
                    "message": "Fetched requested " +req.params.artist+ " albums ",
                    "response": result.rows
                }
                res.send(wrapResponse);
            }
            else{
                let wrapResponse = {
                    "status": "Not Found",
                    "message": "Artist " + req.params.artist + " does not exist",
                    "response": null
                }
                res.statusCode=400
                res.send(wrapResponse);
            }
        }
        else{
            let wrapResponse={
                "status":"Error",
                "message":err.message,
                "response":null
            }
            res.statusCode=404
            res.send(wrapResponse);
        }
    });
});
///REST API dohvat po nazivu studija u kojem je album sniman
app.get('/apiAlbums/studio/:studio', (req, res)=>{
    client.query(`Select * from albums where studio='${req.params.studio}'`, (err, result)=>{
        if(!err){
            if (result.rows.length>0){
                let wrapResponse = {
                    "status": "OK",
                    "message": "Fetched requested studio ",
                    "response": result.rows
                }
                res.send(wrapResponse);
            }
            else{
                let wrapResponse = {
                    "status": "Not Found",
                    "message": "Studio " + req.params.studio + " does not exist",
                    "response": null
                }
                res.statusCode=400
                res.send(wrapResponse);
            }
        }
        else{
            let wrapResponse={
                "status":"Error",
                "message":err.message,
                "response":null
            }
            res.statusCode=404
            res.send(wrapResponse);
        }
    });
});
///REST API dohvat po nazivu albuma
app.get('/apiAlbums/album/:albumname', (req, res)=>{
    client.query(`Select * from albums where albumname='${req.params.albumname}'`, (err, result)=>{
        if(!err){
            if (result.rows.length>0){
                let wrapResponse = {
                    "status": "OK",
                    "message": "Fetched requested album ",
                    "response": result.rows
                }
                res.send(wrapResponse);
            }
            else{
                let wrapResponse = {
                    "status": "Not Found",
                    "message": "Album " + req.params.albumname + " does not exist",
                    "response": null
                }
                res.statusCode=400
                res.send(wrapResponse);
            }
        }
        else{
            let wrapResponse={
                "status":"Error",
                "message":err.message,
                "response":null
            }
            res.statusCode=404
            res.send(wrapResponse);
        }
    });
});

///get kontroler za openapi
app.get('/openApi', (req, res)=>{
    res.send(JSON.parse(openApiSpecs))
})


///REST API brisanje albuma po poretku na listi
app.delete('/apiAlbums/:id', (req, res)=> {
    let deleteQuery = `delete from albums where positiononlist=${req.params.id}`
    let selectQuery = `Select * from albums where positiononlist=${req.params.id}`
    client.query(selectQuery, (err, result)=> {
        if (!err){
            if (result.rows.length != 0) {

                client.query(deleteQuery, (err, result) => {
                    if (!err) {
                        let wrapResponse =
                            {
                                "status": "OK",
                                "message": "Album on position " + req.params.id + ' deleted',
                                "response": null

                            }
                        res.send(wrapResponse);
                    } else {
                        let wrapResponse =
                            {
                                "status": "Delete error",
                                "message": err.message,
                                "reponse": null
                            }
                        res.statusCode=404
                        res.send(wrapResponse);
                    }

                })
            } else {
                let wrapResponse =
                    {
                        "status": "Not found",
                        "message": "Album on position " + req.params.id + ' does not exist, nothing to delete',
                        "response": null

                    }
                res.statusCode=400
                res.send(wrapResponse);
            }
        }
        else{
            let wrapResponse =
                {
                    "status": "Error",
                    "message": err.message,
                    "reponse": null
                }
            res.statusCode=404
            res.send(wrapResponse);

        }

    })
})
///REST API dodavanje novog albuma
app.post('/apiAlbums', (req, res)=> {
    const album = req.body;
    let selectQuery = `Select * from albums where positiononlist=${album.positiononlist}`
    let insertQuery = `insert into albums(positiononlist, releaseyear, albumname, artist, genre, producer, studio, albumduration, albumlabel, artistscronologyalbumorder, numberoftracks)
                       values(${album.positiononlist}, '${album.releaseyear}', '${album.albumname}', '${album.artist}', '${album.genre}', '${album.producer}', '${album.studio}', '${album.albumduration}', '${album.albumlabel}', '${album.artistscronologyalbumorder}', '${album.numberoftracks}')`

    client.query(insertQuery, (err, result)=>{
        if(!err) {
            client.query(selectQuery, (err, result)=> {
                if (!err){
                    let wrapResponse =
                        {
                            "status": "OK",
                            "message": "Album inserted on position " + album.positiononlist,
                            "reponse": result.rows
                        }

                    res.statusCode=201
                    res.send(wrapResponse);
                }
                else
                {
                    let wrapResponse =
                        {
                            "status": "Error",
                            "message": err.message,
                            "reponse": null
                        }
                    res.statusCode=404
                    res.send(wrapResponse);
                }
            })
        }

        else{
            let wrapResponse =
                {
                    "status": "Error",
                    "message": err.message,
                    "reponse": null
                }
            res.statusCode=404
            res.send(wrapResponse);
        }


    })
})
///REST API update po id-ju u URL-u
app.put('/apiAlbums/:positiononlist', (req, res)=> {
    const album = req.body;
    let selectQuery = `Select * from albums where positiononlist=${req.params.positiononlist}`
    let updateQuery = `update albums
                       SET releaseyear='${album.releaseyear}', 
                        albumname='${album.albumname}', 
                        artist='${album.artist}', 
                        genre='${album.genre}', 
                        producer='${album.producer}', 
                        studio='${album.studio}', 
                        albumduration='${album.albumduration}', 
                        albumlabel= '${album.albumlabel}', 
                        artistscronologyalbumorder='${album.artistscronologyalbumorder}', 
                        numberoftracks='${album.numberoftracks}'
                       where positiononlist = ${req.params.positiononlist}`

    client.query(selectQuery, (err, result)=> {

        if (result.rows.length != 0) {
            client.query(updateQuery, (err, result) => {


                if (!err) {
                    client.query(selectQuery, (err, result) => {
                        if (!err) {
                            let wrapResponse =
                                {
                                    "status": "OK",
                                    "message": "Album updated on position " + req.params.positiononlist,
                                    "reponse": result.rows
                                }


                            res.send(wrapResponse);
                        } else {
                            let wrapResponse =
                                {
                                    "status": "Error",
                                    "message": err.message,
                                    "reponse": null
                                }
                            res.statusCode=404
                            res.send(wrapResponse);
                        }
                    })
                } else {
                    let wrapResponse =
                        {
                            "status": "Error",
                            "message": err.message,
                            "reponse": null
                        }
                    res.statusCode=404
                    res.send(wrapResponse);
                }


            })
        }
        else{
            let wrapResponse =
                {
                    "status": "Not found",
                    "message": "Album on position " + req.params.positiononlist + ' does not exist, nothing to update',
                    "response": null

                }
            res.status(400)
            res.send(wrapResponse);

        }
    })
})

app.use(function(req, res) {
    let wrapResponse =
        {
            "status": "Not implemented",
            "message": "Method not implemented",
            "response": null

        }
    res.status(501).send(wrapResponse);
});


app.use(function(req, res) {
    let wrapResponse =
        {
            "status": "Error",
            "message": "Opps, something went wrong",
            "response": null

        }
    res.status(500).send(wrapResponse);
});
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`)
})