# V21.02.26
$tambuzon=(("700MB","795MB","800MB"),("2001MB","2015MB","2048MB"),("4001MB","4050MB","4096MB"),("10001MB","10100MB","10240MB"))
cls
$buzon=read-host "Introduce buzón (usuario@dominio) "
$result = get-mailbox $buzon -ErrorAction SilentlyContinue | fl prohibit* 
if ($result) {
    write-output $result
    write-output "Opciones de cambio de cuota de buzón:"
    write-output ""
    write-output " 0 - 800 Mb"
    write-output " 1 -   2 Gb"
    write-output " 2 -   4 Gb"
    write-output " 3 -  10 Gb"
    write-output ""
    $opcion=read-host "Intruduce <0-3> para cambiar cuota buzón o <Intro> para finalizar"
    if ($opcion -ge "0" -and $opcion -le "3") {
        Get-Mailbox $buzon | Set-Mailbox -UseDatabaseQuotaDefaults $false -IssueWarningQuota $tambuzon[$opcion][0] -ProhibitSendQuota $tambuzon[$opcion][1] -ProhibitSendReceiveQuota $tambuzon[$opcion][2]
        get-mailbox $buzon | fl prohibit*
    }
}
else {
    write-output ""
    write-output "Buzón $buzon no encontrado. Escalar ticket a N3.C.SISTEMAS INTEGRACION IDC"
    write-output ""
}
