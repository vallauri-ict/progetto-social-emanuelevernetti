const mongo = require("mongodb");
const DBNAME = "socialDB"
const DBaccessPW="UPY3n1Ld50gKvMhw"
const CONNECTION_STRING = "mongodb+srv://Emanuele:" + DBaccessPW + "@socialcluster.hcsme.mongodb.net/"+DBNAME+"?retryWrites=true&w=majority"
const CONNECTION_OPTIONS = { useNewUrlParser: true, useUnifiedTopology: true };
const async = require("async");

const bcrypt = require("bcryptjs");

/* NOTA : SOLUZIONI POSSIBILI
   1) Utilizzare updateMany: NON E' FATTIBILE in quanto dovrebbe utilizzare la
      funzione bcrypt all'interno del comando update: 
      {"$set":{"password":bcrypt.hashSync("password", 10)}}         
   2) Scorrere uno per uno i record restituiti da find e per ognuno eseguire
      il metodo hashSync. Facile da scrivere ma onerosa perchè per ogni singolo
	  record bisogna stare fermi in attesa che hashSync abbia finito il lavoro.
   3) Scorrere uno per uno i record restituiti da find e per ognuno eseguire 
      il metodo hash (asincrono). Soliti problemi: dove e quando faccio la close?
	  dove scrivo le istruzioni di invio risposta al client (che in questo caso
	  non si pone, ma di solito invece sì).
   4) SOLUZIONE MIGLIORE: uso aync.ForEach che lancia in PARALLELO tutte le 
      elaborazioni sui vari record, e per ogni elaborazione utilizzo hashSync.
*/


mongo.MongoClient.connect(CONNECTION_STRING, CONNECTION_OPTIONS, function(err, client) {
    if (err)
        console.log("Errore di connessione al database");
    else {
        const DB = client.db(DBNAME);
        const COLLECTION = DB.collection('users');

        COLLECTION.find({},{"password":1}).toArray(function(err, data) {
			if(err)
				console.log("Errore esecuzione query" + err.message)
			else{
 			/* 1°PARAM = recordSet su cui iterare */
			/* 2°PARAM = funzione da eseguire per ogni item */ 
			/* 3°PARAM = callback finale */
            async.forEach(data,
                function(item, callback) {
                    // le stringhe bcrypt inizano con $2[ayb]$ e sono lunghe 60
                    let regex = new RegExp("^\\$2[ayb]\\$.{56}$");
                    // se la password corrente non è in formato bcrypt
					if (!regex.test(item["password"])) {     
                        let pwd = bcrypt.hashSync(item["password"], 10)
                        COLLECTION.updateOne({"_id":item["_id"]},
						         {"$set":{"password":pwd}}, function(err, data){
                            callback(err);
                        });
                    } 
					else
                        callback(false);
                },
                function(err) {
                    if (err)
                        console.log("Errore: " + err.message);
                    else
                        console.log("operazione eseguita correttamente");
                    client.close();
                })
			}
        });
    }
});
