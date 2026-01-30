[CmdletBinding()]
param(
    [string]$Input,
    [string]$Output,
    [switch]$DryRun,
    [switch]$Backup
)

# Resolve defaults relative to repo root
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$defaultInput = Join-Path $repoRoot 'node_modules\bf6-portal-mod-types\event-handler-signatures.d.ts'
$defaultOutput = Join-Path $repoRoot '.vscode\portal.code-snippets'

if (-not $PSBoundParameters.ContainsKey('Input') -or [string]::IsNullOrWhiteSpace($Input)) { $Input = $defaultInput }
if (-not $PSBoundParameters.ContainsKey('Output') -or [string]::IsNullOrWhiteSpace($Output)) { $Output = $defaultOutput }

function Get-FirstSentence([string]$commentRaw) {
    if ([string]::IsNullOrWhiteSpace($commentRaw)) { return 'BF6 Portal handler stub.' }
    $text = $commentRaw -replace "`r`n", "`n"

    # JSDoc block /** ... */
    if ($text.Trim().StartsWith('/**')) {
        $text = $text -replace '^\s*/\*\*', '' -replace '\*/\s*$', ''
        $lines = $text -split "`n"
        $processed = @()
        foreach ($l in $lines) {
            $l2 = ($l -replace '^\s*\*\s?', '')
            if ($l2 -and ($l2 -notmatch '^\s*@\w+')) { $processed += $l2 }
        }
        $joined = ($processed -join ' ').Trim()
    }
    # Line comments // ...
    elseif ($text -match '^\s*//') {
        $lines = $text -split "`n"
        $processed = @()
        foreach ($l in $lines) {
            $l2 = ($l -replace '^\s*//\s?', '').Trim()
            if ($l2) { $processed += $l2 }
        }
        $joined = ($processed -join ' ').Trim()
    }
    else {
        $joined = ($text -replace '\s+', ' ').Trim()
    }

    $joined = ($joined -replace '\s+', ' ').Trim()
    if ([string]::IsNullOrWhiteSpace($joined)) { return 'BF6 Portal handler stub.' }

    $m = [regex]::Match($joined, '^(.*?\.(?:\s|$))')
    if ($m.Success) { return $m.Groups[1].Value.Trim() } else { return $joined }
}

try {
    if (-not (Test-Path -LiteralPath $Input)) {
        throw "Input file not found: $Input"
    }

    $text = Get-Content -LiteralPath $Input -Raw -Encoding UTF8

    # First pass: find all function signatures
    $sigPattern = '(?m)^\s*export\s+function\s+(?<name>\w+)\s*\((?<params>[^)]*)\)\s*:\s*void\s*;'
    $matches = [regex]::Matches($text, $sigPattern)

    if ($matches.Count -eq 0) {
        Write-Warning 'No handler signatures found.'
        if ($DryRun) { return }
    }

    $aliasMap = @{}

    $ongoing = @()
    $on = @()

    foreach ($m in $matches) {
        $name = $m.Groups['name'].Value
        $paramsRaw = $m.Groups['params'].Value
        # Normalize params into a single line, keep spacing
        $params = ($paramsRaw -replace "`r`n", ' ') -replace '\s{2,}', ' '
        $params = $params.Trim()

        # Find nearest preceding comment block or line comments just above the signature
        $pre = $text.Substring(0, $m.Index)
        $jsdoc = [regex]::Match($pre, '(?s)/\*\*(?<block>.*?)\*/\s*$')
        $linec = $null
        if (-not $jsdoc.Success) { $linec = [regex]::Match($pre, '(?m)(?<lines>(?:\s*//.*\r?\n)+)\s*$') }
        if ($jsdoc.Success) {
            $description = Get-FirstSentence $jsdoc.Value
        }
        elseif ($linec -and $linec.Success) {
            $description = Get-FirstSentence $linec.Value
        }
        else {
            $description = 'BF6 Portal handler stub.'
        }

        $prefixArray = @("bf6.$name")
        if ($aliasMap.ContainsKey($name)) { $prefixArray += $aliasMap[$name] }

        $snippet = @{ 
            scope       = 'typescript'
            prefix      = $prefixArray
            description = $description
            body        = @("export function $name($params): void {", "`t//TODO", '$0', "}")
        }

        $obj = [pscustomobject]@{ Name = $name; Snippet = $snippet }
        if ($name -like 'Ongoing*') { $ongoing += $obj } else { $on += $obj }
    }

    $ongoing = $ongoing | Sort-Object Name
    $on = $on | Sort-Object Name

    $ordered = [ordered]@{}
    foreach ($item in ($ongoing + $on)) { $ordered[$item.Name] = $item.Snippet }

    $json = ConvertTo-Json $ordered -Depth 6

    if ($DryRun) {
        Write-Host ("Found {0} handlers: {1} Ongoing*, {2} On*" -f $matches.Count, $ongoing.Count, $on.Count)
        Write-Host "Sample entries:"
        $i = 0
        foreach ($k in $ordered.Keys) {
            Write-Host " - $k => prefixes: " -NoNewline
            $pfx = $ordered[$k].prefix -join ', '
            Write-Host $pfx
            $i++
            if ($i -ge 5) { break }
        }
        return
    }

    $outDir = Split-Path -Parent $Output
    if (-not (Test-Path -LiteralPath $outDir)) { New-Item -ItemType Directory -Path $outDir -Force | Out-Null }

    if ($Backup -and (Test-Path -LiteralPath $Output)) {
        $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
        Copy-Item -LiteralPath $Output -Destination ("{0}.{1}.bak" -f $Output, $stamp) -Force
    }

    Set-Content -LiteralPath $Output -Value $json -Encoding UTF8
    Write-Host ("Wrote snippets to {0} ({1} handlers)" -f $Output, $matches.Count)
}
catch {
    Write-Error $_
    exit 1
}