"use strict"

$(()=>{
	$("#signUpErrLBL").hide()
	$("#signInErrLBL").hide()
	$("#signInSpinner").hide()
	$("#signUpSpinner").hide()


  	//nat push
	for(let nat in natJSON){
		$("<option value="+nat+">"+natJSON[nat]+"</option>").appendTo(("#nat"))
	}
	$("#nat option[value=IT]").prop("selected",true)

	$("#signUp").on("click",()=>{
		$("#innerSignUn").addClass("loader").text("")
		if($("#signUpPassword").val()!="" && 
		$("#signUpName").val()!="" && 
		$("#signUpSurname").val()!="" && 
		$("#signUpEmail").val()!="" && 
		$("#signUpUsername").val()!="" )
		{
			let request=inviaRichiesta("post","/api/signUp",
			{"name":$("#signUpName").val(),
			"surname":$("#signUpSurname").val(),
			"username":$("#signUpUsername").val(),
			"pw":$("#signUpPassword").val(),
			"email":$("#signUpEmail").val(),
			"nat":$("#nat").val()})
			request.fail(()=>{
				$("#innerSignIn").removeClass("loader").text("Sign Up")
				$("#signUpErrLBL").text("Error during registration, try again").show()
			})
			request.done((data)=>{
				console.table(data)
				window.location.reload()
			})
		}
		else{
			$("#innerSignIn").removeClass("loader").text("Sign Up")
			$("#signUpErrLBL").text("Some fields are empty").show()
		}
	})

	$("#signIn").on("click",()=>{
		$("#innerSignIn").addClass("loader").text("")
		let request= inviaRichiesta("post","/api/login",{"username":$("#loginUSR").val(),"password":$("#loginPW").val()})
		request.fail(()=>{
			$("#innerSignIn").removeClass("loader").text("Sign In")
			$("#signInErrLBL").show()
		})
		request.done((data)=>{
			console.log(data)
			if(data["ris"]=="ok")
				window.location.href="index.html";
		})
	})
})
