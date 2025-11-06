$Port = 8080;
$StaticDir = "./";

$Listener = New-Object System.Net.HttpListener;

$Listener.Prefixes.Add("http://localhost:$Port/");

$Listener.Start();

If ($Listener.IsListening) {
    Write-Host "Server is listening on port $Port";
} Else {
    Write-Host "An error occurred while starting the server";
};

# Relative to $StaticDir
$StaticRoutes = @{
    "/" = "/index.html";
    "/404" = "/404.html";
};

# Used to reply to requests easily
Function Reply {
    Param(
        [System.Net.HttpListenerResponse]$Response,
        [int]$StatusCode,
        [string]$Content
    );

    $Buffer = [System.Text.Encoding]::UTF8.GetBytes($Content);
    $Response.StatusCode = $StatusCode;
    $Response.ContentLength64 = $Buffer.Length;
    $Response.OutputStream.Write($Buffer, 0, $Buffer.Length);
    $Response.OutputStream.Close();

    $Response.close();
}

# Used to serve dynamic content
Function Add {
    Param(
        [System.Net.HttpListenerRequest]$Request,
        [System.Net.HttpListenerResponse]$Response
    );

    $A = $Request.QueryString["a"];
    $B = $Request.QueryString["b"];

    $Result = [int]$A + [int]$B;

    $Html = "<h1>$A + $B = $Result</h1>";

    Reply $Response 200 $Html;
}

$FunctionalRoutes = @{
    "/add" = ${Function:Add};
};

While ($Listener.IsListening) {
    $Context = $Listener.GetContext();
    $Request = $Context.Request;
    $Response = $Context.Response;

    $FilePath = $Request.Url.LocalPath;

    # check if the functional route exists
    If ($FunctionalRoutes.ContainsKey($FilePath)) {
        Write-Host "Serving $FilePath as a functional route";

        $FunctionalRoutes[$FilePath].Invoke($Request, $Response);

        Continue;
    };

    If ($FilePath -Eq "/kill") {
        Write-Host "Shutting down...";

        $Html = "<h1>Shutting down...</h1>";

        Reply $Response 200 $Html;

        $Listener.Stop();
        
        Break;
    };

    # check if the static route exists
    If ($StaticRoutes.ContainsKey($FilePath)) {
        $FilePath = $StaticRoutes[$FilePath];
    };

    $Extension = [System.IO.Path]::GetExtension($FilePath);

    Switch ($Extension) {
        ".html" {
            $MimeType = "text/html";
        };
        ".css" {
            $MimeType = "text/css";
        };
        ".js" {
            $MimeType = "text/javascript";
        };
        ".png" {
            $MimeType = "image/png";
        };
        ".jpg" {
            $MimeType = "image/jpg";
        };
        ".gif" {
            $MimeType = "image/gif";
        };
        Default {
            $MimeType = "application/octet-stream";
        };
    };

    Write-Host "Serving $StaticDir$FilePath as $MimeType";

    Try {
        $FileStream = [System.IO.File]::OpenRead("$StaticDir$FilePath");
        $Response.ContentLength64 = $FileStream.Length;
        $Response.ContentType = $MimeType;
        $FileStream.CopyTo($Response.OutputStream);
    } Catch {
        $Response.StatusCode = 404;
    };

    $Response.Close();
};
