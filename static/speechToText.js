"use strict"

let btn
let contaniner
let speechRecon
let recon

window.onload = () => {
	btn = document.getElementById("btnSpeech")
	contaniner = document.getElementById("txtMessage")
	speechRecon = window.SpeechRecognition || window.webkitSpeechRecognition
	recon = new speechRecon()

	try {
		recon.onstart = function () {
			btn.disabled=true
			contaniner.value=""
			console.log("you can talk")
		}

		recon.onresult = function (event) {
			let current = event.resultIndex
			let trs = event.results[current][0].transcript
			contaniner.value = trs
			btn.disabled=false
		}

		btn.addEventListener("click", function () {
			recon.start()
		})
	}
	catch(e){
		alert(e)
	}
}

