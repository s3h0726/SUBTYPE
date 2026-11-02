# 제주 공식 서버의 중간 인증서 체인은 Windows 신뢰 저장소로 정상 검증한다.
# 인증서 검증을 끄지 않으며, 숫자 검색 결과는 공식 운행계통 ID로 중복 제거한다.
$ErrorActionPreference = 'Stop'
$jejuRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../data/kr/canonical/jeju-source'))
[IO.Directory]::CreateDirectory($jejuRoot) | Out-Null
0..9 | ForEach-Object -Parallel {
  $file = Join-Path $using:jejuRoot "분류-$_.json"
  if (!(Test-Path -LiteralPath $file)) { Invoke-WebRequest -Uri 'https://bus.jeju.go.kr/publicTrafficInformation/getBusRouteNum' -Method Post -Body @{GROUTE_TYPE="$_"} -OutFile $file -TimeoutSec 20 }
} -ThrottleLimit 2
$jejuNumbers = Get-ChildItem -LiteralPath $jejuRoot -Filter '분류-*.json' | ForEach-Object { Get-Content -Raw -LiteralPath $_.FullName | ConvertFrom-Json } | ForEach-Object { [regex]::Matches($_.GSCHEDULE_NM,'(?<![0-9])[0-9]{2,4}(?:-[0-9]+)?(?![0-9])') | ForEach-Object {$_.Value} } | Sort-Object -Unique
$jejuNumbers | ForEach-Object -Parallel {
  $file = Join-Path $using:jejuRoot "노선번호-$_.json"
  if (!(Test-Path -LiteralPath $file)) { Invoke-WebRequest -Uri 'https://bus.jeju.go.kr/data/search/searchSimpleLineListByLineNumAndType' -Method Post -Body @{keyword="$_";type="2"} -OutFile $file -TimeoutSec 20 }
} -ThrottleLimit 2
$jejuRows = Get-ChildItem -LiteralPath $jejuRoot -Filter '노선번호-*.json' | ForEach-Object { Get-Content -Raw -LiteralPath $_.FullName | ConvertFrom-Json } | Sort-Object routeId -Unique
$jejuRows | ConvertTo-Json -Depth 20 | Set-Content -Encoding utf8 -LiteralPath (Join-Path $jejuRoot 'inventory.json')
Write-Output "제주 공식 운행계통 $($jejuRows.Count)건 수집 시작"
$jejuRows | ForEach-Object -Parallel {
  $row = $_
  foreach ($kind in @('info','shape')) {
    $file = Join-Path $using:jejuRoot "$($row.routeId)-$kind.json.gz"
    if (Test-Path -LiteralPath $file) { continue }
    $method = if ($kind -eq 'info') {'getLineInfoByLineId'} else {'getLinkInfoByLineId'}
    $url = "https://bus.jeju.go.kr/data/search/$method"
    for ($attempt=0; $attempt -lt 2; $attempt++) {
      try {
        $response = Invoke-WebRequest -Uri $url -Method Post -Body @{lineId=$row.routeId} -TimeoutSec 20
        $bytes = [Text.Encoding]::UTF8.GetBytes($response.Content)
        $null = $response.Content | ConvertFrom-Json
        $stream = [IO.File]::Create($file)
        $gzip = [IO.Compression.GZipStream]::new($stream,[IO.Compression.CompressionLevel]::Optimal)
        $gzip.Write($bytes,0,$bytes.Length); $gzip.Dispose(); $stream.Dispose()
        @{url=$url;method='POST';lineId=$row.routeId;retrievedAt=[DateTime]::UtcNow.ToString('o');sha256=[Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($bytes)).ToLowerInvariant()} | ConvertTo-Json | Set-Content -LiteralPath "$file.source.json" -Encoding utf8
        break
      } catch {
        if ($attempt -eq 1) { @{routeId=$row.routeId;kind=$kind;reason=$_.Exception.Message} | ConvertTo-Json | Set-Content -LiteralPath "$file.error.json" -Encoding utf8 }
      }
    }
    Start-Sleep -Milliseconds 150
  }
} -ThrottleLimit 3
Write-Output '제주 공식 자료 수집 완료'
