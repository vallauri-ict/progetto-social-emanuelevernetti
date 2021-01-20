"use strict"

$(()=> {
    $("#errorLBL").css("color","red").hide()
    $("#modP").hide()
    $("#highP").hide()

    let _username
    let dercyptTKN
    let currOBJid
    let currNAT
    let currenBIO
    let request=inviaRichiesta("post","/api/getCookie")	
	request.fail(errore)
	request.done((data)=>{
		dercyptTKN=JSON.parse(window.atob(data.split('.')[1]))
		_username= dercyptTKN["username"]
        console.log(dercyptTKN)
        $("#myAccountBTN").html(_username)

        let request=inviaRichiesta("post","/api/followedUsers",{"myUser":_username})
        request.fail(errore)
        request.done((data)=>{
            currOBJid=data[0]["_id"]
            currenBIO=data[0]["biography"]
            currNAT=data[0]["nationality"]

            $("#profileIMG").prop("src",data[0]["IMGthumbnail"])
            $("#bio").val(currenBIO)
            $("#nat option[value="+currNAT+"]").prop("selected",true)

            $("#loadingPage").hide()
            $("#highP").show()
            $("#modP").show()
        })
    })

    for(let nat in natJSON){
		$("<option value="+nat+">"+natJSON[nat]+"</option>").appendTo(("#nat"))
	}

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

    $("#pushMod").on("click",()=>{

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
            formData.append("objID", currOBJid);
        }

        //log
        for(let item of formData){
            let key=item[0];
            let value = item[1];
            console.log(key, value);
        }

        //file.arrayBuffer().then((arrayBuffer) => {
            //blob = new Blob([new Uint8Array(arrayBuffer)], {type: file.type });
            //console.log(blob);
           

        if($("#bio").val().trim()==currNAT.trim())
            $("#bio").val("NACK")

        let request=inviaRichiesta("post","/api/accountMod",{"userId":currOBJid,"email":$("#emailTXT").val(),"name":$("#nameTXT").val(),"surname":$("#surnameTXT").val(),"nat":$("#nat").val(),"bio":$("#bio").val()})
        request.fail(errore)
        request.done((data)=>{
            console.log(data)
            if(data["stat"]=="err")
                $("#errorLBL").show()
            else{
                if(ISimage){
                    let rsqMultipart=inviaRichiestaMultipart("POST","/api/moveIMG",formData)
                    rsqMultipart.fail(errore)
                    rsqMultipart.done((data)=>{
                        console.log(data)
                    })
                }
            }
        })
        //})
    })
    .hover(()=>{
        $(event.target).html("Let's Push It !")
    })
    .mouseleave(()=>{
        $(event.target).html("Modify")
    })
})