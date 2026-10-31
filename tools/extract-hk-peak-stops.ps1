param([string]$Repository = (Split-Path -Parent $PSScriptRoot), [string]$OutputPath)
$sourcePath = Join-Path $Repository 'data/hk/sources/phase6/peak-stops.mdb'
$targetPath = if ($OutputPath) { $OutputPath } else { Join-Path $Repository 'data/hk/sources/phase6/peak-stops-extracted.json' }
$connection = New-Object System.Data.OleDb.OleDbConnection("Provider=Microsoft.ACE.OLEDB.16.0;Data Source=$sourcePath;Mode=Read;")
try {
  $connection.Open()
  $command = $connection.CreateCommand()
  $command.CommandText = 'SELECT * FROM RSTOP ORDER BY ROUTE_ID, ROUTE_SEQ, STOP_SEQ'
  $reader = $command.ExecuteReader()
  $rows = @()
  while ($reader.Read()) {
    $row = [ordered]@{}
    for ($column = 0; $column -lt $reader.FieldCount; $column++) {
      $value = $reader.GetValue($column)
      if ($value -is [DateTime]) { $value = $value.ToString('yyyy-MM-ddTHH:mm:ss', [Globalization.CultureInfo]::InvariantCulture) }
      if ($value -is [DBNull]) { $value = $null }
      $row[$reader.GetName($column)] = $value
    }
    $rows += [pscustomobject]$row
  }
  $reader.Close()
  if ($rows.Count -ne 12) { throw 'Government source changed; re-review its calling orders before replacing the snapshot.' }
  [IO.File]::WriteAllText($targetPath, (($rows | ConvertTo-Json -Depth 8) + "`n"), (New-Object Text.UTF8Encoding($false)))
  Write-Output "Extracted $($rows.Count) source rows in read-only mode. Recheck pinned SHA256 before rebuilding."
} finally { $connection.Close() }
