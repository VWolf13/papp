

//Generic text input dialog function.
function _ShowTextDialog( title, deflt, callback )
{
    //Get orientation.
    var orient = app._139();
    var textWidth = (orient=="Portrait" ? 0.8 : 0.5 );
    var btnWidth =  (orient=="Portrait" ? 0.4 : 0.25 );

    //Create dialog window.
    var dlgTxt = app._286( title );
    var layTxtDlg = app._259( "linear", "vertical,fillxy" );
    layTxtDlg.SetPadding( 0.04, 0.02, 0.04, 0 );

    //Create dialog controls.
    txtTxtDlg = app._267( deflt, textWidth, -1, "Left" );
    layTxtDlg.AddChild( txtTxtDlg );
    
    var layTxtDlg2 = app._259( "linear", "horizontal,fillxy,center" );
    layTxtDlg2.SetMargins( 0, 0.02, 0, 0.01 ); 
   
    //Create cancel button.
    var btnTxtCancel = app._261( "Cancel", btnWidth );
    btnTxtCancel.SetOnTouch( function(){dlgTxt.Dismiss()} );
    layTxtDlg2.AddChild( btnTxtCancel );
    
    //Create ok button.
    var btnTxtOK = app._261( "OK", btnWidth );
    btnTxtOK.SetOnTouch( function() {
        dlgTxt.Dismiss(); 
        var txt = txtTxtDlg.GetText();
        if( txt ) callback( txt ); 
        } );
    layTxtDlg2.AddChild( btnTxtOK );
    layTxtDlg.AddChild( layTxtDlg2 );

    //Add dialog layout and show dialog.
    dlgTxt.AddLayout( layTxtDlg );
    dlgTxt.Show();
}

//Show a tooltip message.
var _dlgTip = null;
_ShowTip = function( msg, left, top, timeOut, options )
{
    //Get options.
    if( options ) options = options.toLowerCase(); 
    else options = "";
    
    //Remove old tip if still showing.
    if( _dlgTip ) { _dlgTip.Dismiss(); clearTimeout(_dlgTip._tm) }
    
    //Create dialog window.
    _dlgTip = app._286( null, "AutoCancel,NoDim,"+options );
    _dlgTip.SetBackColor( "#00000000" );
    _dlgTip.SetPosition( left, top );
    
    //Create tip layout.
    var layTipDlg = app._259( "linear", "vertical,fillxy" );
    
    //Create tip text.
    var txt = app._266( msg, -1,-1, "MultiLine,left,Html" );
    txt.SetTextSize( 22, "ps" );
    if( options.indexOf("up")>-1 ) txt.SetBackground( "/Res/drawable/tooltip_up" );
    else  txt.SetBackground( "/Res/drawable/tooltip_down" );
    txt.SetOnTouch( function() { _dlgTip.Dismiss() } );
    layTipDlg.AddChild( txt );
    
    //Add dialog layout and show dialog.
    _dlgTip.AddLayout( layTipDlg );
    _dlgTip.Show();
    if( timeOut ) {
        _dlgTip._tm = setTimeout( function(){ 
            if(_dlgTip)_dlgTip.Dismiss(); _dlgTip=null
        }, timeOut );
    }
}

//Generic wizard dialog.
function _Wizard( title, width, height, callback, options )
{
    var curPage = 0;
    
    //Check for premium
    if( !app._41() ) {
        console.log( "WARNING: CreateWizard is a Premium feature!" ); 
        return;
    }
    //Create dialog window.
    var dlg = app._286( title, options+"nocancel" ); //eg. nofocus
    dlg.SetTitle( title, "center" );
    var layDlg = app._259( "linear", "vertical,fillxy" );
    layDlg.SetSize( width, height );
    //layDlg.SetPadding( 0.04, 0.02, 0.04, 0 );
    
    //Create content layout.
    var layContent = app._259( "Linear", "VCenter" );
    layContent.SetSize( width*0.9, height*0.8 );
    layDlg.AddChild( layContent );
    
	//Create layout.
    var layHoriz = app._259( "Linear", "Horizontal" );
    layDlg.AddChild( layHoriz );
    
    //Create an array of icon buttons. //"[fa-home]" 
    var btns = ["[fa-times]","[fa-arrow-left]","[fa-arrow-right]"];
    for( var i=0; i<btns.length; i++ )
    {
        var btn = app._261( btns[i], width/4, height/8, "FontAwesome" ); 
        btn.SetMargins( 0.01,0,0.01,0 );
        btn.icon = btns[i];
        btn.SetTextSize( 18 );
        btn.SetTextColor( "#555555" );
        if( i==1 ) btn.SetEnabled( false );
        layHoriz.AddChild( btn ); 
        btns[i] = btn;
    }
    
    //Show/start the wizard.
    this.Show = function()
    {
        dlg.Show();
        
        //Fire callback for page setup and first page.
        callback( layContent, curPage );
        callback( layContent, ++curPage );
    }
    
    //General methods.
    this.GetType = function() { return "Wizard" }
    this.Dismiss = function() { dlg.Dismiss(); curPage=0 }
    this.Hide = function() { dlg.Hide() }
    this.Finish = function() { btns[2].SetText("[fa-check]") }
    this.GetDialog = function() { return dlg }
    this.GetLayout = function() { return layContent  }
    this.GetButtons = function() { return btns }
    this.IsVisible = function() {  return dlg.IsVisible() }
    
    //Handle button presses.
    dlg.btns_OnTouch = function()
    {
        switch( this.icon )
        {
            //case "[fa-home]": web.LoadUrl( url ); break;
            case "[fa-arrow-left]": 
                if( --curPage > 0 ) callback( layContent, curPage );
                btns[2].SetText("[fa-arrow-right]");
                break;
            case "[fa-arrow-right]": 
                  callback( layContent, ++curPage );
                break;
            case "[fa-times]":  
                dlg.Dismiss(); 
                callback( layContent, -1 ); 
                break;
        }
        
        btns[1].SetEnabled( curPage > 1 );
    }

    //Set callbacks.
    for( var i=0; i<btns.length; i++ )
        btns[i].SetOnTouch( dlg.btns_OnTouch ); 
  
    //Add dialog layout and show dialog.
    dlg.AddLayout( layDlg );
}



//Wifi scanning object.
function _WifiScan( title1, title2, callback, options, extra )
{
    var self = this;
    var ctrl=null, onSelect=callback;
    var dlgScan, dlgLst, tScan, tProg, prog=0, name="", address="", filter=null;
    var list = "";
    
    this.Select = function( filt )
    {
        app._101( false );
        filter = filt;
        list = "";
        
        //Get options and default params.
		if( options ) options = options.toLowerCase(); 
		else options = "";
		if( !title1 ) title1 = "Scanning";
		if( !title2 ) title2 = "Select WiFi";
        
        //Create dialog window and layout.
        var ops = (options.indexOf("force")>-1?"NoCancel":"AutoCancel");
        dlgScan = app._286( title1, ops );
        dlgScan.SetOnCancel( self.OnCancel );
        var lay = app._259( "linear", "vertical,fillxy" );
        //lay.SetPadding( 0.04, 0.02, 0.04, 0.02 );
    
        //Create list.
        dlgLst = app._268( "", 0.7, 0.5 );
        dlgLst.SetMargins( 0.04, 0.02, 0.04, 0.02 );
        if( options.indexOf("large")>-1) dlgLst.SetTextMargins( 0,0.02,0,0.02 )
        dlgLst.SetOnTouch( self.OnChoose );
        lay.AddChild( dlgLst );
        
        //Add dialog layout and show dialog.
        dlgScan.AddLayout( lay );
        dlgScan.Show();
        
        //Start scanning.
        app._78( this.OnDevice );
    
        //tScan = setTimeout( StopScan, 30000 );
        tProg = setInterval( this.ShowProgress, 500 );
        
        app._101( true );
    }
    
    this.OnDevice = function( ssids )
    {
        app._101( false );

        if( extra ) {
            var ext = extra.split("|");
            for( var i=0; i<ext.length; i++ )
                dlgLst.AddItem( ext[i] );
        }
        
        ssids = ssids.split("|");
        for( ssid in ssids ) 
        {
            var id = ssids[ssid]
            if( filter==null || id.indexOf(filter)>-1 ) 
            {
                if( list.indexOf( id ) < 0 ) {
                    dlgLst.AddItem( id );
                    list += id + "|";
                }
            }
        }
        
        clearInterval( tProg );
        dlgScan.SetTitle( title2 );
        app._101( true );
    }
    
    this.ShowProgress = function()
    {
        app._101( false );
        var dots = "";
        for( var i=0; i<prog; i++ ) dots += ".";
        if( prog++==5 ) prog = 0;
        dlgScan.SetTitle( title1+dots );
        app._101( true );
    }
    
    this.OnChoose = function( title, body )
    {
        app._101( false );
        
        address = body;
        name = title;
        clearTimeout( tScan ); 
        
        if( onSelect ) onSelect( name, address );
        dlgScan.Dismiss();
        app._101( true );
    }
    
    this.OnCancel = function()
    {
        clearTimeout( tScan ); 
        clearInterval( tProg );
        dlgScan.Dismiss();
    }
}

//Checklist dialog class.
function _CheckList( title, list, callback, width, height, options )
{
    var self = this;
    var dlg, onFinish=callback;
    var lst1//,lst2,lst3;
    
    this.Show = function( filt )
    {
        app._101( false );
        
        //Get options and default params.
		if( options ) options = options.toLowerCase(); 
		else options = "";
        
        //Create dialog window and layout.
        //var ops = (options.indexOf("force")>-1?"NoCancel":"AutoCancel");
        dlg = app._286( title, options )//options+"Kiosk" );
        dlg.SetTitleHeight( 42 );
        
        var w = width>-1?width:0.75;
        var h = height>-1?height:0.75;
        var lay = app._259( "linear", "vertical,fillxy,Center" );
        lay.SetPadding( 4,4,4,4, "dip" )
        var layHoriz = app._259( "linear", "Horizontal" );	
        lay.AddChild( layHoriz )
    
        //Create first list.
        var orient = app._139()
        var minW = (orient=="Landscape" ? 0.1 : 0.2 )
        var btnWidth =  (w/3>minW ? w/3 : minW);
        var btnHeight = (orient=="Landscape" ? 0.14 : 0.08 )
        lst1 = app._268( toList(list), w, h-btnHeight*2, "Horiz,ShowScroll" );
        //lst1.SetTextMargins( 0,0,0,0 )
        //lst1.SetTextSize( 15 )
        lst1.SetIconMargins( 8,2,0,0,"dip" )
        lst1.SetIconSize( 22, "dip" )
        if( options.indexOf("compact")>-1 ) lst1.SetDivider( -0.007, "#00000000" )
        else lst1.SetDivider( 0, "#00000000" )
        lst1.SetOnTouch( self.OnChoose );
        layHoriz.AddChild( lst1 );
        
        //Create OK and Cancel buttons.
        var orient = app._139();
        //var textWidth = (orient=="Portrait" ? 0.8 : 0.5 );
        var largeFont = (options.indexOf("largefont") > -1);
        //var btnWidth = -1
        var layBtns = app._259( "linear", "horizontal,center" );
        //layBtns.SetMargins( 0, 0.02, 0, 0.01 ); 
        var btnTxtCancel = app._261( "Cancel", btnWidth, btnHeight, "" );
        btnTxtCancel.SetOnTouch( self.OnCancel );
        btnTxtCancel.SetTextSize(  largeFont ? 18 : 12 );
        layBtns.AddChild( btnTxtCancel );
        var btnTxtOK = app._261( "OK", btnWidth, btnHeight, "" );
        btnTxtOK.SetOnTouch( self.OnOk );
        btnTxtOK.SetTextSize(  largeFont ? 18 : 12 );
        layBtns.AddChild( btnTxtOK );
        lay.AddChild( layBtns );
        
        //Add dialog layout and show dialog.
        dlg.AddLayout( lay );
        dlg.Show();
        
        app._101( true );
    }
    
    //Handle user selection
    this.OnChoose = function( title, body, icon, index )
    {
        //app._101( false );
        
        if( options.indexOf("sun-moon")>-1 ) 
            lst1.SetItemByIndex( index, null, null, (icon=="\uf185"?"[fa-moon-o]":"[fa-sun-o]") )
        else 
            lst1.SetItemByIndex( index, null, null, (icon=="\uf046"?"[fa-square-o]":"[fa-check-square-o]") )
    }
    
    //Handle OK button
    this.OnOk = function()
    {
        var out = []
        var data = lst1.GetList()
        for( var d in data ) { 
            var check = false
            if( options.indexOf("sun-moon")>-1 ) check = (data[d].image=="\uf185"?true:false) 
            else check = (data[d].image=="\uf046"?true:false)
            out.push( { title : data[d].title, check : check } )
        }
        if( onFinish ) onFinish( out );
        dlg.Dismiss();
    }
    
    //Handle cancel button.
    this.OnCancel = function()
    {
        dlg.Dismiss()
        if( onFinish ) onFinish( null );
    }
    
    //Convert array to | separated list.
    var toList = function( data )
    {
        var list = "";
        
        if( typeof data == "object" ) {
            for( var d in data ) 
                list += (list?",":"") + (data[d].title+"::"+data[d].check)
        }
        else list = data
        
        if( options.indexOf("sun-moon")>-1 ) {
            list = list.replace( /:true/g, ":[fa-sun-o]" );
            list = list.replace( /:false/g, ":[fa-moon-o]" );
        }
        else {
            list = list.replace( /:false/g, ":[fa-square-o]" );
            list = list.replace( /:true/g, ":[fa-check-square-o]" );
        }
        //alert( "tolist:" + list )
        return list;
    }
    
    //Set the check list items.
    this.SetList = function( data )
    {
        lst1.SetList( toList(data), "," )
    }
    
    //Show the dialog.
    self.Show();
}

