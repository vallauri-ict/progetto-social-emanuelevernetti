"use strict"

$(()=> {
    let row1=$("#row1")
    let row2=$("#row2")
    let row3=$("#row3")
    let row4=$("#row4")
    let row5=$("#row5")
    let rowPost=$("#rowPost")
    let postWR=$("#postWrapper")
    let loadingRow=$("#loadingAccount")
    let noPost=$("#noPost")

    let img=$("#profileIMG")
    let usernameH1=$("#usernameTitle")
    let postNumberTag=$("#postN")
    let followTag=$("#followN")
    let nominative=$("#nominative")
    let natLBL=$("#natCode")
    let natFlag=$("#natIMG")
    let dataCreation=$("#accountCreationData")
    let email=$("#email")
    let bio=$("#bioTxt")

    row1.hide()
    row2.hide()
    row3.hide()
    row4.hide()
    row5.hide()
    rowPost.hide()
    noPost.hide()
    $("#follow").prop("disabled",true)

    let _username
    let userToFind=localStorage.getItem("userToFind")
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

    request=inviaRichiesta("post","/api/accoutDetails",{"userToFind":userToFind})
    request.fail(errore)
    request.done((data)=>{
        console.table(data)

        if(data[0]["biography"].length==0)
            $("#BiographyLBL").hide()
        
        img.prop("src",data[0]["IMGthumbnail"])
        usernameH1.html(data[0]["username"])
        postNumberTag.html(data[0]["postNumber"])
        followTag.html(data[0]["followed"].length)
        nominative.html(data[0]["name"]+" "+data[0]["surname"])
        natLBL.html(data[0]["nationality"])
        natFlag.prop("src","https://www.countryflags.io/"+data[0]["nationality"].toLowerCase()+"/shiny/64.png")
        dataCreation.html(new Date(data[0]["signUpDate"]).toLocaleDateString())
        email.html(data[0]["email"])
        bio.html(data[0]["biography"])

        let request=inviaRichiesta("post","/api/postAccount",{"user":userToFind})
        request.fail(errore)
        request.done((data)=>{
            console.log(data)

        if(data.length>0 && data[0]!=""){
            $("<h2>").css("text-align","center").html("Post").appendTo(postWR)
            for (let i = 0; i < data.length; i++) {
                let div1=$("<div class='card rounded shadow-sm border-0'>").appendTo(postWR)
                let div2=$("<div class='card-body p-4'>").appendTo(div1)
                $("<img  alt='Immagine' class='img-fluid d-block mx-auto mb-3'>").prop("src",data[i]["img"]).appendTo(div2)
                let H5=$("<h5>").appendTo(div2)
                $("<a class='text-dark'></a>").html(data[i]["username"]).prop("value",data[i]["username"]).addClass("linkToProfile").appendTo(H5)
                $("<p class='small text-muted font-italic'></p>").html(data[i]["postCaption"]).appendTo(div2)
                $("<br>").appendTo(postWR)
            }
        }
        else{
            noPost.show()
        }   
        })

        loadingRow.hide()
        row1.show()
        row2.show()
        row3.show()

        if(_username!=userToFind)
            row4.show()
        else
            row5.show()

        rowPost.show()


    request=inviaRichiesta("post","/api/followedUsers",{"myUser":_username})
    request.fail(errore)
    request.done((data)=>{
        followSetup(data[0]["followed"].includes(userToFind))
    })
    })



    $("#setting").on("click",()=>{
        window.location.href="settings.html"
    })

    $(row4).on("click",".followed",()=>{
        $("#follow").prop("disabled",true)
        let request=inviaRichiesta("post","/api/unfollow",{"toActionUSR":usernameH1.html(),"myUser":_username})
        request.fail(errore)
        request.done((data)=>{
            followSetup(false)
        })
    })
    $(row4).on("click",".nonFollowed",()=>{
        $("#follow").prop("disabled",true)
        let request=inviaRichiesta("post","/api/follow",{"toActionUSR":usernameH1.html(),"myUser":_username})
        request.fail(errore)
        request.done((data)=>{
            followSetup(true)
        })
    })

    $("#message").on("click",function (){
        window.localStorage.setItem("chatWUSR", usernameH1.html())
        window.location.href="chat.html"
    })

    function followSetup(payload){
    if(payload)
        $("#follow").html("Followed").addClass("followed")
        .hover(()=>{
            $(event.target).html("Unfollow")
        })
        .mouseleave(()=>{
            $(event.target).html("Followed")
        })
    else
    $("#follow").html("Follow").addClass("nonFollowed")        
    .hover(()=>{
        $(event.target).html("Follow")
    })
    .mouseleave(()=>{
        $(event.target).html("Follow") 
    })

    $("#follow").prop("disabled",false)
    }
})