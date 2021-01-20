"use strict"

let isSending
let dercyptTKN

$(()=> {
	$("#btnInvia").prop("disabled",true)

	let socket

	let chatID
	let _username
	let _usernameUsr2=window.localStorage.getItem("chatWUSR")
	$("#title").html("Hawxy--chat with: "+_usernameUsr2) 
	let request=inviaRichiesta("post","/api/getCookie")	
	request.fail(errore)
	request.done((data)=>{
		dercyptTKN=JSON.parse(window.atob(data.split('.')[1]))
		_username= dercyptTKN["username"]
		console.log(dercyptTKN)

		let request=inviaRichiesta("post","/api/chatID",{"user1":_username,"user2":_usernameUsr2})
		request.fail(errore)
		request.done((data)=>{
			console.table(data)
			chatID=data[0]["_id"]

			for(let i=0;i<data[0]["MEX"].length;i++){
				visualizza(data[0]["MEX"][i]["sendedBy"],data[0]["MEX"][i]["MESSAGE"],data[0]["MEX"][i]["sendedDate"])
			}

			$("#btnInvia").prop("disabled",false)
		})
	})

	socket = io.connect();
	console.log("socket: " + socket);

	
	socket.on('connect', function () {
		// 1) invio username
		socket.emit("username", _username+"-"+_usernameUsr2);

		// 2) invio mesaggio
		$("#btnInvia").click(function (e) {
			e.stopPropagation()
			let request=inviaRichiesta("get","/api/trojanRequest")
			request.fail(errore)

			request.done(()=>{
				if($("#txtMessage").val()!=""){
					//caricamento del mex sul db
					let msg = $("#txtMessage").val();
					socket.emit("message", {
						"msg":msg,
						"chatWUSR":_usernameUsr2,
					});
					$("#txtMessage").val("")
				}
			})
		});

		// 3) disconnessione
		$("#btnDisconnetti").click(function () {
			window.localStorage.removeItem("chatWUSR")
			socket.disconnect();
			window.location.href="index.html"
		});

		// 4) disclogOutonnessione
		$("#btnLogOut").click(function () {
			window.localStorage.removeItem("chatWUSR")
			socket.disconnect();
			let request=inviaRichiesta("post","/api/logOut")
			request.fail(errore)
			request.done((data)=>{
				console.table(data)
				window.location.href="login.html";
			})
		});
	});


	socket.on('notify_message', function (data) {
		// ricezione di un messaggio dal server		
		data = JSON.parse(data);
		visualizza(data.from, data.message, data.date);
	});

	socket.on('userNOK', function () {
		alert("Nome già esistente!");
		//let username = prompt("Inserisci lo username:");
		socket.emit("username",_username);
	});

	socket.on('disconnect', function () {
		//alert("Sei stato disconnesso!");
	});



	function visualizza(username, message, date) {
		let wrapper = $("#wrapper")
		let container
		if(username==_username)
		 	container = $("<div class='message-container right'></div>");
		else
			container = $("<div class='message-container'></div>");
		container.appendTo(wrapper);


		// username e date
		date = new Date(date);
		let mittente = $("<small class='message-from' style='font-size:7pt;'><strong style='font-size:12pt;'>" + username + "</strong></br>" + date.toLocaleDateString()+" - "+date.toLocaleTimeString() +"</small></br>");
		mittente.appendTo(container);

		// messaggio
		message = $("<br><p class='message-data' style='font-size:16pt;'>" + message + "</p>");
		message.appendTo(container);


		// auto-scroll dei messaggi
		/* la proprietà html scrollHeight rappresenta l'altezza di wrapper oppure
		   l'altezza del testo interno qualora questo ecceda l'altezza di wrapper */
		let h = wrapper.get(0).scrollHeight;
		// fa scorrere il teso verso l'alto
		wrapper.animate({ scrollTop: h }, 500);
	}

	$("body").on("keypress",(e)=>{
		if(e.keyCode==13)
			$("#btnInvia").trigger("click")
	})
});
