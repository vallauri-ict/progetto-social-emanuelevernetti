"use strict"

const PORT = 1337

const https = require("https")
const express = require("express")
const fs = require("fs")
const bodyParser = require("body-parser")
const colors = require("colors")
const bcrypt = require("bcryptjs")
const async = require("async")
const fileupload = require("express-fileupload")
const cloudinary = require("cloudinary").v2

const jwt = require("jsonwebtoken")
let JWTkey
let token
const TTL_Token = 1800;

const mongo = require("mongodb")
const DBNAME = "socialDB"
const DBaccessPW = "UPY3n1Ld50gKvMhw"
const CONNECTION_STRING = "mongodb+srv://Emanuele:" + DBaccessPW + "@socialcluster.hcsme.mongodb.net/" + DBNAME + "?retryWrites=true&w=majority"
const CONNECTION_OPTIONS = { useNewUrlParser: true, useUnifiedTopology: true }

let privateKey = fs.readFileSync("./sslcert/key.pem")
let certificate = fs.readFileSync("./sslcert/cert.pem")
let credentials = { key: privateKey, cert: certificate, passphrase: "Lebronjames23" }

let app = express()

let httpsServer = https.createServer(credentials, app)
const io = require("socket.io")(httpsServer)

httpsServer.listen(PORT, () => {
    console.log("https Server running on port: " + PORT)
    init()
})

/* ************************************************************* */
let paginaErrore = "";
function init() {
    fs.readFile("./static/error.html", (err, data) => {
        if (!err) {
            paginaErrore = data.toString();
        }
        else {
            paginaErrore = "<h1>Risosra non trovata</h1>"
        }
    })
    fs.readFile("./key/private.key", function (err, data) {
        if (!err) {
            JWTkey = data.toString();
        }
        else {
            //Richiamo la route di gestione degli errori
            console.log("File mancante: private.key");
            httpsServer.close();
        }
    })

    app.response.log = (err) => {
        console.log(colors.red("Error " + err.message))
    }

    cloudinary.config({
        cloud_name: 'dybkxna2t', 
        api_key: '978498296556915', 
        api_secret: '78UnUO9pLI_xzYd_K2xUk4BK3y4' 
    })
}

app.use("/", (req, res, next) => {
    //original url contiene la risosrsa richiesta
    console.log("--> " + req.method + " : " + req.originalUrl)
    next()
})

app.get("/", function (req, res, next) {
    controllaToken(req, res, next);
});

app.get("/index.html", function (req, res, next) {
    controllaToken(req, res, next);
});
app.use("/", express.static("./static"))

app.use(bodyParser.urlencoded({limit: '50mb', extended: true}))
app.use(bodyParser.json({limit: '50mb', extended: true}))


app.use("/", (req, res, next) => {
    res.setHeader("Access-Contol-Allow-Origin", "*")
    next()
})

app.use("/", (req, res, next) => {
    if (Object.keys(req.query).length > 0)
        console.log("Parametri GET " + JSON.stringify(req.query))
    if (Object.keys(req.body).length > 0)
        console.log("Parametri BODY " + JSON.stringify(req.body))

    next()
})

app.use("/", fileupload({
    "limits": {"fileSize": (50 * 1024 * 1024)}
    //non bisogna mettere next() perchè i middleware lo fanno da soli
}));

app.use("/",express.json({"limit":"50mb"}));

/* ************************************************************* */
//route specifiche
let users = []
let roomID=[]
let rooms=[]

io.on("connection", function (socket) {
    let chatRoomID
    let user = {};
    user.username = "";
    user.socket = socket;
    user.socketId = socket.id;
    users.push(user);
    log(" User " + colors.yellow(socket.id) + " connected!");


    // 1) ricezione username
    socket.on("username", function (username) {
        /*
        let trovato = false;
        for (let item of users) {
            if (username == item.username) {
                trovato = true;
            }
        }
        */
        /* let vet = users.find(function (item) {
            return (username == item.username);
        }); */
        if (cercaUtente(username.split("-")[0]) != null) {
            socket.emit("userNOK", "userNOK");
            return;
        }

        console.log(" usr1 --> " + colors.green(username.split("-")[0]) + " usr2 --> " + colors.magenta(username.split("-")[1]))

        user.username = username.trim().split("-")[0];

        log(" User " + colors.yellow(this.id) + " name is " + colors.yellow(user.username));

        //Scorro il vettore degli users per salvare username ANCHE all"interno del vettore users 
        for (let item of users) {
            if (this.id == item.socketId) {
                item.username = username.trim().split("-")[0];
            }
        }

        let _this=this
        mongo.MongoClient.connect(CONNECTION_STRING, CONNECTION_OPTIONS, function (err, client) {
            if (err)
                res.status(503).send("Errore di connessione al DB")
            else {
                let col = client.db(DBNAME).collection("chatAssociations")

                col.find({ "usr1": user.username, "usr2": username.split("-")[1] }).toArray((err, data) => {
                    if (data.length == 0) {
                        col.find({ "usr2": user.username, "usr1": username.split("-")[1] }).toArray((err, data) => {
                            if (data.length == 0) {
                                col.insertOne({ "usr1": user.username, "usr2": username.split("-")[1], "MEX": [] }).then((resp) => {
                                    col.find({ "usr1": user.username, "usr2": username.split("-")[1] }).toArray((err, data) => {
                                            chatRoomID = data[0]["_id"]
                                            rooms.push({"id":chatRoomID,"user1":username.trim().split("-")[0],"user2":username.trim().split("-")[1]})
                                            ChatID(chatRoomID,username,_this)
                                        client.close()
                                    })
                                })
                            }
                            else {
                                chatRoomID = data[0]["_id"]
                                rooms.push({"id":chatRoomID,"user1":username.trim().split("-")[0],"user2":username.trim().split("-")[1]})
                                ChatID(chatRoomID,username,_this)
                                client.close()
                            }
                        })
                    }
                    else {
                        chatRoomID = data[0]["_id"]
                        rooms.push({"id":chatRoomID,"user1":username.trim().split("-")[0],"user2":username.trim().split("-")[1]})
                        ChatID(chatRoomID,username,_this)
                        client.close()
                    }

                })
            } 
        })

        for (let i = 0; i < rooms.length; i++) {
            if(rooms[i]["user1"]==username.trim().split("-")[0] && rooms[i]["user2"]==username.trim().split("-")[1] || rooms[i]["user1"]==username.trim().split("-")[1] && rooms[i]["user2"]==username.trim().split("-")[0])
                this.join(rooms[i]["id"]);
        }

        //if ((user.username == "test") || (user.username == "responder")) {
        //    this.join("room1");
        //}
        //else {
        //    this.join("room2");
        //}
    });


    // 2) ricezione di un messaggio	 
    socket.on("message", function (data) {
        /* for(let user of users){
            if(this.id == user.socketId){
                log("User " + colors.yellow(user.username) + "-" + colors.white(user.socket.id) + " sent " + colors.green(data));			 
                // notifico a tutti i socket (compreso il mittente) il messaggio appena ricevuto 
                io.sockets.emit("notify_message", JSON.stringify({
                    "from": user.username,	 
                    "message": data,			 
                    "date": new Date()	 
                }));	
            }
        } */
        //let username = user.username;
        log("User " + colors.yellow(user.username) + "-" + colors.white(user.socket.id) + " sent " + colors.green(data["msg"]) + " MsgTo--> " + colors.green(data["chatWUSR"]) + " ToRoom--> " + colors.magenta(chatRoomID))

        let response = JSON.stringify({
            "from": user.username,
            "message": data["msg"],
            "date": new Date()
        });

        mongo.MongoClient.connect(CONNECTION_STRING, CONNECTION_OPTIONS, function (err, client) {
            if (err)
                res.status(503).send("Errore di connessione al DB")
            else {
                let col = client.db(DBNAME).collection("chatAssociations")

                col.updateOne({ "_id": mongo.ObjectID(chatRoomID) }, { $push: { "MEX": { "sendedBy": user.username, "sendedDate": new Date(), "MESSAGE": data["msg"] } } }, (error, result) => {
                    if (error)
                        console.log(colors.red(error.message))
                    else {
                        console.log(colors.green("DB updated ") + result)        
                        for (let i = 0; i < rooms.length; i++) {
                            if(rooms[i]["user1"]==user.username && rooms[i]["user2"]==data["chatWUSR"] || rooms[i]["user1"]==data["chatWUSR"] && rooms[i]["user2"]==user.username){
                                io.to(rooms[i]["id"]).emit("notify_message", response);
                                break;
                            }
                        }
                    }
                    client.close()
                })
            }
        })
        //if ((user.username == "test") || (user.username == "responder")) {
        //    io.to("room1").emit("notify_message", response);
        //}
        //else {
        //    io.to("room2").emit("notify_message", response);
        //}
    });

    // 3) Disconnessione utente
    socket.on("disconnect", function () {
        for (let i = 0; i < roomID.length; i++) {
            if(roomID[i]["ID"]==chatRoomID)
                roomID.splice(i,1)
                break
        }

        let index = users.findIndex(function (item) {
            return (user.username == item.username);
        });
        users.splice(index, 1);
        log(" User " + user.username + " disconnected!");
    });
});

function ChatID(id,username,that){
    roomID.push({"user1":username.split("-")[0],"user2":username.split("-")[1],"ID":id})

    console.log("Chat room ID --> "+ colors.magenta(id))
    that.join(id)
}

// stampa i log con data e ora
function log(data) {
    console.log(colors.cyan("[" + new Date().toLocaleTimeString() + "]") + ": " + data);
}

function cercaUtente(username) {
    let vet = users.find(function (item) {
        return (username == item.username);
    });
    return vet;
}

app.post("/api/chatID", (req, res, next) => {
    mongo.MongoClient.connect(CONNECTION_STRING, CONNECTION_OPTIONS, function (err, client) {
        if (err)
            res.status(503).send("Errore di connessione al DB")
        else {
            let col = client.db(DBNAME).collection("chatAssociations")  

            col.find({ "usr1": req.body["user1"], "usr2": req.body["user2"] }).toArray((err, data) => {
                if (err) {
                    res.status(500).send("Errore inserimento nuovo record\n" + err.message)
                    client.close()
                }
                else {
                    if (data.length == 0) {
                        col.find({ "usr2": req.body["user1"], "usr1": req.body["user2"] }).toArray((err, data) => {
                            if (data.length == 0) {

                            }
                            else {
                                res.send(data)
                                client.close()
                            }
                        })
                    }
                    else {
                        res.send(data)
                        client.close()
                    }
                }
            })
        }
    })
})


//Registration
app.post("/api/signUp", function (req, res, next) {
    mongo.MongoClient.connect(CONNECTION_STRING, CONNECTION_OPTIONS, function (err, client) {
        if (err)
            res.status(503).send("Errore di connessione al DB")
        else {
            console.table(req.body)
            let col = client.db(DBNAME).collection("users")

            //check unique
            //e-mail
            col.find(
                { "email": req.body["email"] }
            ).toArray((err, data) => {
                if (err) {
                    res.status(500).send("Errore inserimento nuovo record\n" + err.message)
                    client.close()
                }
                else {
                    if (data.length > 0) {
                        res.send({
                            "connection": "OK",
                            "ISunique": "false",
                            "message": "The inserted e-mail has already been used"
                        })
                        client.close()
                    }
                    else {
                        //username
                        col.find(
                            { "username": req.body["username"] }
                        )
                            .toArray((err, data) => {
                                if (err)
                                    res.status(500).send("Errore inserimento nuovo record\n" + err.message)
                                else {
                                    if (data.length > 0) {
                                        res.send({
                                            "connection": "OK",
                                            "ISunique": "false",
                                            "message": "The inserted username has already been used"
                                        })
                                        client.close()
                                    }
                                    else {
                                        let Pcrypt = bcrypt.hashSync(req.body["pw"], 10)
                                        //insert part
                                        col.insertOne({
                                            "email": req.body["email"],
                                            "username": req.body["username"],
                                            "password": Pcrypt,
                                            "name": req.body["name"],
                                            "surname": req.body["surname"],
                                            "nationality": req.body["nat"],
                                            "signUpDate": new Date(),
                                            "followed": [],
                                            "postNumber": 0,
                                            "biography": "",
                                            "posts": [],
                                        },
                                            (err, data) => {
                                                if (err)
                                                    res.status(500).send("Errore inserimento nuovo record\n" + err.message)
                                                else
                                                    res.send({
                                                        "connection": "OK",
                                                        "ISunique": "true",
                                                        "message": "Username and Password are unique GG"
                                                    })
                                                client.close()
                                            })
                                    }
                                }
                            })
                    }
                }
            })
        }
    })
})






//JWT
//login
app.post('/api/login', function (req, res, next) {
    mongo.MongoClient.connect(CONNECTION_STRING, CONNECTION_OPTIONS, function (err, client) {
        if (err)
            res.status(503).send("Errore di connessione al database")
        else {
            const db = client.db(DBNAME)
            const collection = db.collection("users")

            let username = req.body["username"]
            collection.findOne({ "username": username }, function (err, dbUser) {
                if (err)
                    res.status(500).send("Internal Error in Query Execution")
                else {
                    if (dbUser == null)
                        res.status(401).send("Username e/o Password non validi")
                    else {
                        //req.body.password --> password in chiaro inserita dall'utente
                        //dbUser.password --> password cifrata contenuta nel DB
                        //Il metodo compare() cifra req.body.password e la va a confrontare con dbUser.password
                        bcrypt.compare(req.body.password, dbUser.password, function (err, ok) {
                            if (err)
                                res.status(500).send("Internal Error in bcrypt compare")
                            else {
                                if (!ok)
                                    res.status(401).send("Username e/o Password non validi")
                                else {
                                    let token = createToken(dbUser)
                                    writeCookie(res, token)
                                    console.log(colors.green("Access Successful"))
                                    res.send(JSON.stringify({ "ris": "ok" }))
                                }
                            }
                        });
                    }
                }
                client.close();
            })
        }
    });
});

//logout
app.post("/api/logOut", (req, res, next) => {
    res.clearCookie("token")
    res.send(JSON.stringify({ "logOut": true, "cookieStatus": "dropped", "nextStep": "redirectToLogin" }))
})

app.use("/api", function (req, res, next) {
    controllaToken(req, res, next);
});

function controllaToken(req, res, next) {
    let token = readCookie(req);
    if (token == "") {
        inviaErrore(req, res, 403, "Token mancante");
    }
    else {
        jwt.verify(token, JWTkey, function (err, payload) {
            if (err) {
                inviaErrore(req, res, 403, "Token scaduto o corrotto");
            }
            else {
                let newToken = createToken(payload);
                writeCookie(res, newToken);
                req.payload = payload; //salvo il payload dentro request in modo che le api successive lo possano leggere e ricavare i dati necessari
                next();
            }
        });
    }
}

function inviaErrore(req, res, code, errorMessage) {
    if (req.originalUrl.startsWith("/api/")) {
        res.status(code).send(errorMessage);
    }
    else {
        res.sendFile(__dirname + "/static/login.html");
    }
}

function readCookie(req) {
    let valoreCookie = "";
    if (req.headers.cookie) {
        let cookies = req.headers.cookie.split(';');
        for (let item of cookies) {
            item = item.split('='); //item = chiave=valore --> split --> [chiave, valore]
            if (item[0].includes("token")) {
                valoreCookie = item[1];
                break;
            }
        }
    }
    return valoreCookie;
}

//data --> record dell'utente
function createToken(data) {
    //sign() --> si aspetta come parametro un json con i parametri che si vogliono mettere nel token
    let json = {
        "_id": data["_id"],
        "username": data["username"],
        "iat": data["iat"] || Math.floor((Date.now() / 1000)),
        "exp": (Math.floor((Date.now() / 1000)) + TTL_Token)
    }
    let token = jwt.sign(json, JWTkey);
    console.log(token);
    return token;
}

function writeCookie(res, token) {
    //set() --> metodo di express che consente di impostare una o più intestazioni nella risposta HTTP
    res.set("Set-Cookie", `token=${token};max-age=${TTL_Token};path=/;httponly=true`);
}

/********** Api di risposta alle richieste **********/
app.get("/api/trojanRequest", function (req, res, next) {
    res.send(JSON.stringify("entered"))
})

app.post("/api/getCookie", (req, res, next) => {
    let cookie = readCookie(req)
    res.send(JSON.stringify(cookie))
})

app.post("/api/followedUsers", (req, res, next) => {
    mongo.MongoClient.connect(CONNECTION_STRING, CONNECTION_OPTIONS, function (err, client) {
        if (err)
            res.status(503).send("Errore di connessione al database")
        else {
            const db = client.db(DBNAME)
            const collection = db.collection("users")

            collection.find({ "username": req.body["myUser"] }).toArray((err, data) => {
                if (err)
                    res.status(500).send("Internal Error in Query Execution")
                else
                    res.send(data)
                client.close()
            })
        }
    })
})

app.post("/api/serchUser",(req, res, next) => {
    mongo.MongoClient.connect(CONNECTION_STRING, CONNECTION_OPTIONS, function (err, client) {
        if (err)
            res.status(503).send("Errore di connessione al database")
        else {
            const db = client.db(DBNAME)
            const collection = db.collection("users")

            collection.find({ "username": {$regex:"^"+req.body["userSTR"],$options:"i"} }).toArray((err, data) => {
                if (err)
                    res.status(500).send("Internal Error in Query Execution")
                else
                    res.send(data)
                client.close()
            })
        }
    })
})

app.post("/api/accoutDetails",(req, res, next) => {
    mongo.MongoClient.connect(CONNECTION_STRING, CONNECTION_OPTIONS, function (err, client) {
        if (err)
            res.status(503).send("Errore di connessione al database")
        else {
            const db = client.db(DBNAME)
            const collection = db.collection("users")

            collection.find({ "username": req.body["userToFind"] }).toArray((err, data) => {
                if (err)
                    res.status(500).send("Internal Error in Query Execution")
                else
                    res.send(data)
                client.close()
            })
        }
    })
})



app.post("/api/follow",(req, res, next) => {
    mongo.MongoClient.connect(CONNECTION_STRING, CONNECTION_OPTIONS, function (err, client) {
        if (err)
            res.status(503).send("Errore di connessione al database")
        else {
            const db = client.db(DBNAME)
            const collection = db.collection("users")

            collection.updateOne({ "username": req.body["myUser"] },{$push:{"followed":req.body["toActionUSR"]}},(err, data) => {
                if (err)
                    res.status(500).send("Internal Error in Query Execution")
                else
                    res.send(data)
                    console.log(data)
                client.close()
            })
        }
    })
})
app.post("/api/unfollow",(req, res, next) => {
    mongo.MongoClient.connect(CONNECTION_STRING, CONNECTION_OPTIONS, function (err, client) {
        if (err)
            res.status(503).send("Errore di connessione al database")
        else {
            const db = client.db(DBNAME)
            const collection = db.collection("users")

            collection.updateOne({ "username": req.body["myUser"] },{$pull:{"followed":req.body["toActionUSR"]}},(err, data) => {
                if (err)
                    res.status(500).send("Internal Error in Query Execution")
                else
                    res.send(data)
                client.close()
            })
        }
    })
})


let currnetObj
app.post("/api/accountMod",(req, res, next) => {
    mongo.MongoClient.connect(CONNECTION_STRING, CONNECTION_OPTIONS, function (err, client) {
        if (err)
            res.status(503).send("Errore di connessione al database")
        else {
            const db = client.db(DBNAME)
            const collection = db.collection("users")

            let toModJSON={}

            currnetObj=req.body["userId"]
            if(req.body["email"]!="" && req.body["email"]!=null && req.body["email"]!=undefined){
                toModJSON["email"]=req.body["email"]
            }
            if(req.body["name"]!="" && req.body["name"]!=null && req.body["name"]!=undefined){
                toModJSON["name"]=req.body["name"]
            }
            if(req.body["surname"]!="" && req.body["surname"]!=null && req.body["surname"]!=undefined){
                toModJSON["surname"]=req.body["surname"]
            }
            if(req.body["bio"]!="NACK"){
                toModJSON["biography"]=req.body["bio"]
            }
            toModJSON["nationality"]=req.body["nat"]


                collection.findOne({"email":toModJSON["email"]},(err, data)=>{
                    if(err)
                        res.status(500).send("Internal Error in Query Execution")
                    else{
                        if(data!=null){
                            res.send(JSON.stringify({"stat":"err"}))
                            client.close()
                        }
                        else{

                            collection.updateOne({ "_id": new mongo.ObjectID(req.body["userId"])},{$set:toModJSON},(err, data) => {
                                if (err)
                                    res.status(500).send("Internal Error in Query Execution")
                                else{
                                    res.send(data)
                                }
                                client.close()
                            })
                            
                        }
                    }
                }) 

        }
        })
    })


app.post("/api/moveIMG",(req, res, next) => {
    let files=[]
    console.log(req["files"])
    if (Array.isArray(req["files"]["elencoFiles"]))
    {
        files = req["files"]["elencoFiles"];
    }
    else
    {
        files.push(req["files"]["elencoFiles"]);
    }
    let path
    async.forEach(files,
        function (item, callback)
        {
            path=__dirname + "/temporaryItem/" + item["name"]
            item.mv((__dirname + "/temporaryItem/" + item["name"]), function (err, data)
            {
                callback(err, data);
            });
        },
        function (err, data)
        {
            if (!err)
            {
                cloudinary.uploader.upload(path,(error,result)=>{
                    if(error){
                        console.log(error)
                        res.status(500).send("Internal Error in Query Execution")
                    }
                    else{
                        console.log(result)
                        mongo.MongoClient.connect(CONNECTION_STRING, CONNECTION_OPTIONS, function (err, client) {
                            if (err){
                                console.log(err)
                                res.status(503).send("Errore di connessione al database")
                            }
                            else {
                                const db = client.db(DBNAME)
                                const collection = db.collection("users")

                                collection.updateOne({ "_id": new mongo.ObjectID(currnetObj) },{$set:{"IMGthumbnail":result["secure_url"]}},(err, data) => {
                                    if (err){
                                        console.log(err)
                                        res.status(500).send("Internal Error in Query Execution")
                                    }
                                    else
                                        res.send(data)
                                    client.close()
                                })
                            }
                        })
                    }
                })
            }
            else
            {
                res.status(500).send("Internal server error");
            }
        })
    }) 






    let postJSONtoPush={}
    app.post("/api/postSetUp",(req, res, next) => {
        postJSONtoPush["username"]=req.body["username"]
        postJSONtoPush["postCaption"]=req.body["postCaption"]
        postJSONtoPush["date"]=req.body["date"]

        res.send(JSON.stringify({"ris":"ok"}))
    }) 

    app.post("/api/pushPost",(req, res, next) => {
        console.log(req["files"])
        let files=[]
        if (Array.isArray(req["files"]["elencoFiles"]))
        {
            files = req["files"]["elencoFiles"];
        }
        else
        {
            files.push(req["files"]["elencoFiles"]);
        }
        let path
        async.forEach(files,
            function (item, callback)
            {
                path=__dirname + "/temporaryItem/" + item["name"]
                item.mv((__dirname + "/temporaryItem/" + item["name"]), function (err, data)
                {
                    callback(err, data);
                });
            },
            function (err, data)
            {
                if (!err)
                {
                    cloudinary.uploader.upload(path,(error,result)=>{
                        if(error){
                            console.log(error)
                            postJSONtoPush={}
                            res.status(500).send("Internal Error in Query Execution")
                        }
                        else{
                            console.log(result)
                            mongo.MongoClient.connect(CONNECTION_STRING, CONNECTION_OPTIONS, function (err, client) {
                                if (err){
                                    console.log(err)
                                    postJSONtoPush={}
                                    res.status(503).send("Errore di connessione al database")
                                }
                                else {
                                    const db = client.db(DBNAME)
                                    const collection = db.collection("users")
    
                                    postJSONtoPush["img"]=result["secure_url"]
                                    collection.updateOne({ "username": postJSONtoPush["username"] },{$push:{"posts":postJSONtoPush}},(err, data) => {
                                        if (err){
                                            console.log(err)
                                            postJSONtoPush={}
                                            res.status(500).send("Internal Error in Query Execution")
                                        }
                                        else{
                                            postJSONtoPush={}
                                            res.send(data)
                                        }
                                        client.close()
                                    })
                                }
                            })
                        }
                    })
                }
                else
                {
                    postJSONtoPush={}
                    res.status(500).send("Internal server error");
                }
            })
    
    })


    app.post("/api/getPost",(req, res, next) => {
        let postArray=[]
        mongo.MongoClient.connect(CONNECTION_STRING, CONNECTION_OPTIONS, function (err, client) {
            if (err)
                res.status(503).send("Errore di connessione al database")
            else{
                const db = client.db(DBNAME)
                const collection = db.collection("users")

                let usersARR=[]
                let isnopost=true
                let originalFollowed

                collection.findOne({"username":req.body["user"]},(err, data)=>{
                    if(err)
                        res.status(500).send("Internal Error in Query Execution")
                    else{
                        if(data!=null){
                            for(let y=0;y<data["posts"].length; y++){
                                usersARR.push({"user":data["username"],"date":data["posts"][y]["date"]})
                                postArray.push(data["posts"][y])
                                isnopost=false
                            }
                        }
                        if(data["followed"].length!=0){
                            originalFollowed=data["followed"]
                            for (let i = 0; i < data["followed"].length; i++) {
                                collection.findOne({"username":data["followed"][i]},(err, data)=>{
                                    if(err)
                                        res.status(500).send("Internal Error in Query Execution")
                                    else{       
                                        if(data!=null){
                                            for(let y=0;y<data["posts"].length; y++){
                                                usersARR.push({"user":data["username"],"date":data["posts"][y]["date"]})
                                                postArray.push(data["posts"][y])
                                            }
                                        }
                                        console.log(parseInt(originalFollowed.length))
                                        if(originalFollowed.length-1==i){
                                            postArray.sort(sortByProperty("date"))
                                            usersARR.sort(sortByProperty("date"))
                                            res.send({"arrPost":postArray,"username":usersARR})
                                            client.close()
                                        }
                                    }
                                })
                            }
                        }
                        else{
                            if(!isnopost){
                                postArray.sort(sortByProperty("date"))
                                usersARR.sort(sortByProperty("date"))
                                res.send({"arrPost":postArray,"username":usersARR})
                                client.close()
                            }
                            else{
                                res.send(JSON.stringify({"arrPost":[]}))
                                client.close()
                            }
                        }
                    }

                })
            }
        })
    })

    app.post("/api/postAccount",(req, res, next)=>{
        let postArray=[]
        mongo.MongoClient.connect(CONNECTION_STRING, CONNECTION_OPTIONS, function (err, client) {
            if (err)
                res.status(503).send("Errore di connessione al database")
            else{
                const db = client.db(DBNAME)
                const collection = db.collection("users")

                collection.findOne({"username":req.body["user"]},(err, data)=>{
                    if(err)
                        res.status(500).send("Internal Error in Query Execution")
                    else{
                        for(let y=0;y<data["posts"].length; y++){
                            postArray.push(data["posts"][y])
                        }
                        postArray.sort(sortByProperty("date"))
                        res.send(postArray)
                        client.close()
                    }
                })
            }
        })
    })

    function sortByProperty(property){
        return function(a,b){  
            if(a[property] < b[property])  
               return 1;  
            else if(a[property] > b[property])  
               return -1;  
        
            return 0;  
         } 
    }


/* ************************************************************* */
app.use((err, req, res, next) => {
    console.log(err.stack) // stack completo (default)
    if (!err.codice) {
        err.codice = 500
        err.message = "Internal Server Error"
    }
    res.status(err.codice);
    res.send(err.message);
})

app.use("/", (req, res, next) => {
    res.status(404)
    if (req.originalUrl.startsWith("/api/"))
        res.json("risorsa non trovata")
    else
        res.send(paginaErrore)
})


