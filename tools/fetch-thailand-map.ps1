# Windows의 기본 HTTP 클라이언트로 공개 지도 API를 순차 수집한다.
$ErrorActionPreference='Stop'
$thTiles=node tools/fetch-thailand-map.cjs --list | ConvertFrom-Json
New-Item -ItemType Directory -Force -Path data/th/cache | Out-Null
$thQueue=[System.Collections.Generic.Queue[object]]::new()
foreach($thTile in $thTiles.PSObject.Properties){$thQueue.Enqueue(@{Name=$thTile.Name;Box=@($thTile.Value);Depth=0})}
while($thQueue.Count -gt 0){
    $thTile=$thQueue.Dequeue()
    $thOut='data/th/source/map-'+$thTile.Name+'.json'
    if(Test-Path -LiteralPath $thOut){continue}
    $thUrl='https://api.openstreetmap.org/api/0.6/map?bbox='+($thTile.Box -join ',')
    $thRaw='data/th/cache/'+$thTile.Name+'.xml'
    try{
        Start-Sleep -Seconds 5
        Invoke-WebRequest -Uri $thUrl -OutFile $thRaw -TimeoutSec 50
        node tools/normalize-thailand-map.cjs $thRaw $thOut $thUrl
        if($LASTEXITCODE -ne 0){throw '지도 정규화 실패'}
        Write-Output ('수집 완료: '+$thTile.Name)
    }catch{
        $thStatus=[int]$_.Exception.Response.StatusCode
        if($thStatus -eq 400 -and $thTile.Depth -lt 3){
            $thWest,$thSouth,$thEast,$thNorth=$thTile.Box
            $thMidX=($thWest+$thEast)/2
            $thMidY=($thSouth+$thNorth)/2
            $thChildren=@(@($thWest,$thSouth,$thMidX,$thMidY),@($thMidX,$thSouth,$thEast,$thMidY),@($thWest,$thMidY,$thMidX,$thNorth),@($thMidX,$thMidY,$thEast,$thNorth))
            for($thIndex=0;$thIndex -lt 4;$thIndex++){$thQueue.Enqueue(@{Name=$thTile.Name+'-'+$thIndex;Box=$thChildren[$thIndex];Depth=$thTile.Depth+1})}
            Write-Output ('요청 범위를 작게 나눕니다: '+$thTile.Name)
        }else{Write-Warning ('지도 수집 중단: '+$thTile.Name+' '+$_.Exception.Message);break}
    }
}
