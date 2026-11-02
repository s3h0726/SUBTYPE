# 공개 목록의 여객 열차만 요청한다. 화물·회송은 제외하고 서버 대기 지시를 지킨다.
$ErrorActionPreference='Stop'
$thLive=Get-Content data/th/source/current-live.json -Raw -Encoding UTF8 | ConvertFrom-Json
foreach($thTrain in $thLive.trains){
    if($thTrain.freight -or $thTrain.cat -ne 'passenger'){continue}
    $thOut='data/th/source/current-train-'+$thTrain.no+'.json'
    if(Test-Path -LiteralPath $thOut){continue}
    Start-Sleep -Seconds 3
    try{
        Invoke-WebRequest -Uri ('https://rotfai.live/api/train/'+$thTrain.id) -OutFile $thOut -TimeoutSec 35
        Write-Output ('현행 전체 정차 수집: '+$thTrain.no)
    }catch{
        $thStatus=[int]$_.Exception.Response.StatusCode
        if($thStatus -eq 429 -or $thStatus -eq 503){Write-Warning '공급자 요청 제한으로 수집을 중단합니다.';break}
        Write-Warning ('현행 정차 보류: '+$thTrain.no+' '+$_.Exception.Message)
    }
}
