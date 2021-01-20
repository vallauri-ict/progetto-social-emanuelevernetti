"use strict"

$(()=> {
    $("#row1").hide()
    $("#loadingAccount").show()

    let postWR=$("#wrapperPost")

    let _username
    let dercyptTKN
    let request=inviaRichiesta("post","/api/getCookie")	
	request.fail(errore)
	request.done((data)=>{
		dercyptTKN=JSON.parse(window.atob(data.split('.')[1]))
		_username= dercyptTKN["username"]
        console.log(dercyptTKN)

        $("#myAccountBTN").html(_username)

        let request=inviaRichiesta("post","/api/getPost",{"user":_username})	
        request.fail(errore)
        request.done((data)=>{
            console.log(data)

        for (let i = 0; i < data["arrPost"].length; i++) {
            let div1=$("<div class='card rounded shadow-sm border-0'>").appendTo(postWR)
            let div2=$("<div class='card-body p-4'>").appendTo(div1)
            $("<img  alt='Immagine' class='img-fluid d-block mx-auto mb-3'>").prop("src",data["arrPost"][i]["img"]).appendTo(div2)
            let H5=$("<h5>").appendTo(div2)
            $("<a class='text-dark'></a>").html(data["username"][i]["user"]).prop("value",data["username"][i]["user"]).addClass("linkToProfile").appendTo(H5)
            $("<p class='small text-muted font-italic'></p>").html(data["arrPost"][i]["postCaption"]).appendTo(div2)
            $("<br>").appendTo(postWR)
        }

            $("#row1").show()
            $("#loadingAccount").hide()
        })
    })

    $("#logOut").on("click",()=>{
        let request=inviaRichiesta("post","/api/logOut")
        request.fail(errore)
        request.done((data)=>{
            console.table(data)
            window.location.href="login.html";
        })
    })

    $("#myAccountBTN").on("click",function(){
        localStorage.setItem("userToFind",$(this).html())
    })

    $("#wrapperPost").on("click",".linkToProfile",()=>{
        window.localStorage.setItem("userToFind", $(event.target).prop("value"))
        window.location.href="userPage.html"
    })
})