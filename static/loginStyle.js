"use strict"

window.onload= ()=>{
	const signUpBTN = document.getElementById('signUpPanel');
	const signInBTN = document.getElementById('signInPanel');
	const container = document.getElementById('container');

	signUpBTN.addEventListener("click",()=>  {
		container.classList.add("right-panel-active")
	})
	
	signInBTN.addEventListener("click",()=>  {
		container.classList.remove("right-panel-active")
	})
}
