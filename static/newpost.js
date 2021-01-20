"use strict"

$(()=> {
    $("#errorLBL").hide()

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

    $("#pushPost").on("click",()=>{
        let ISimage=false
        let files = $("#uploadThumb").prop("files");
        console.log(files);

        if(files["length"]!=0){
            ISimage=true
        }
        console.log(ISimage);

        //Trasformo il vettore di files in formato formData
        let formData = new FormData();
        for(let item of files){
            formData.append("elencoFiles", item);
        }

        //log
        for(let item of formData){
            let key=item[0];
            let value = item[1];
            console.log(key, value);
        }

        let request=inviaRichiesta("post","/api/postSetUp",{"username":_username,"postCaption":$("#caption").val(),"date":new Date()})
        request.fail(errore)
        request.done((data)=>{
            if(data["ris"]!="ok")
                $("#errorLBL").show()
            else{
                if(ISimage && $("#caption").val()!=""){
                    let rsqMultipart=inviaRichiestaMultipart("POST","/api/pushPost",formData)
                    rsqMultipart.fail(errore)
                    rsqMultipart.done((data)=>{
                        console.log(data)

                        window.location.href="index.html"
                    })
                }
                else{
                    $("#errorLBL").show()
                }
            }

        })
    })
})