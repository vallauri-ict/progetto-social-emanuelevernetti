"use strict"

$(()=> {
    let toSerchBox=$("#toSerch")
    let wrapperForUserCard=$("#wrapperForUserCard")
    let stringToSend=""

    $("<br>").appendTo(wrapperForUserCard)
    $("<h1>").html("Search a user").css("text-align","center").appendTo(wrapperForUserCard)

    let _username
    let dercyptTKN
    let request=inviaRichiesta("post","/api/getCookie")	
	request.fail(errore)
	request.done((data)=>{
		dercyptTKN=JSON.parse(window.atob(data.split('.')[1]))
		_username= dercyptTKN["username"]
        console.log(dercyptTKN)

        $("#myAccountBTN").html(_username)
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

    toSerchBox.on("keydown",(e)=>{
        let isEntered=false
        let isfunctionBTN=false
        if(e.keyCode>=32 && e.keyCode!=91 && e.keyCode!=93 && (e.keyCode<112 || e.keyCode>123)){
            stringToSend+=e.key
            isEntered=true
        }
        else if(e.keyCode==8){
            stringToSend=stringToSend.substring(0,stringToSend.length-1)
            isEntered=true
        }
        else if(e.keyCode>=112 && e.keyCode<=123)
            isfunctionBTN=true

        if(isEntered && stringToSend.length>=1){
            let request=inviaRichiesta("Post","/api/serchUser",{"userSTR":stringToSend})

            request.done((data)=>{
                wrapperForUserCard.empty()
                console.log(data)
                for (let i = 0; i < data.length; i++) {
                    $("<br>").appendTo(wrapperForUserCard)
                    let div1=$("<div class='card rounded shadow-sm border-0 profile'>").prop("userToFind",data[i]["username"]).appendTo(wrapperForUserCard)
                    let h5=$("<h5> </h5>").appendTo(div1)
                    $("<a class='text-dark' id='user-"+i+" profile'></a>").html(data[i]["username"]).css("margin","5%").prop("userToFind",data[i]["username"]).appendTo(h5)
                    $("<p class='small text-muted font-italic profile'></p>").css("margin-left","5%").html("Name: "+data[i]["name"]).prop("userToFind",data[i]["username"]).appendTo(div1)
                    $("<p class='small text-muted font-italic profile'></p>").css("margin-left","5%").html("Surname: "+data[i]["surname"]).prop("userToFind",data[i]["username"]).appendTo(div1)
                    $("<p class='small text-muted font-italic profile'></p>").css("margin-left","5%").html("Nationality: "+data[i]["nationality"]).prop("userToFind",data[i]["username"]).appendTo(div1)
                }
                if(data.length==0){
                    $("<br>").appendTo(wrapperForUserCard)
                    $("<h1>").html("User not found!").css("text-align","center").appendTo(wrapperForUserCard)
                }
            })
        }
        else if(!isfunctionBTN){ 
            wrapperForUserCard.empty()
            $("<br>").appendTo(wrapperForUserCard)
            $("<h1>").html("Search a user").css("text-align","center").appendTo(wrapperForUserCard)
        }
    })

    $("#wrapperForUserCard").on("click",".profile",()=>{
        window.localStorage.setItem("userToFind", $(event.target).prop("userToFind"))
        window.location.href="userPage.html"
    })
})