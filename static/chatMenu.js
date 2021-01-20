"use strict"


let dercyptTKN
$(()=>{
    let wrapperForUserCard=$("#wrapperACC")

    let _username
	let request=inviaRichiesta("post","/api/getCookie")	
	request.fail(errore)
	request.done((data)=>{
		dercyptTKN=JSON.parse(window.atob(data.split('.')[1]))
		_username= dercyptTKN["username"]
        console.log(dercyptTKN)
        $("#myAccountBTN").html(_username)
        
        let request=inviaRichiesta("Post","/api/followedUsers",{"myUser":_username})
        request.fail(errore)
        request.done((data)=>{
            console.log(data)

            $("#spinner").hide()
            for(let i=0;i<data[0]["followed"].length;i++){
                $("<br>").appendTo(wrapperForUserCard)
                let div1=$("<div class='card rounded shadow-sm border-0'>").addClass("profile").prop("userToFind",data[0]["followed"][i]).appendTo(wrapperForUserCard)
                let h5=$("<h5> </h5>").appendTo(div1)
                $("<a class='text-dark' id='user-"+i+"'></a>").html(data[0]["followed"][i]).css("margin","5%").appendTo(h5)
                let divBTNgroup=$("<div class='btn-group' role='group' aria-label='Basic example'>").appendTo(div1)
                $("<button type='button' class='btn btn-outline-dark' id='prf'>Profile</button>").addClass("profile").prop("userToFind",data[0]["followed"][i]).appendTo(divBTNgroup)
                //$("<button type='button' class='btn btn-outline-dark' id='chatB'>Go to chat</button>").addClass("chat").prop("userToFind",data[0]["followed"][i]).appendTo(divBTNgroup)
                //$("<div>").prop("id","followed-"+i+"-"+data[0]["followed"][i]).addClass("center").html(data[0]["followed"][i]).appendTo($("#wrapperACC"))
            }
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

        //$("#wrapperACC").on("click","div",()=>{
        //    window.localStorage.setItem("chatWUSR", $(event.target).html())
        //    window.location.href="chat.html"
        //})

        $("#wrapperACC").on("click",".profile",()=>{
            window.localStorage.setItem("userToFind", $(event.target).prop("userToFind"))
            window.location.href="userPage.html"
        })
	})
})