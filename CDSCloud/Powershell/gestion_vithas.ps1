#V21.02.26
add-pssnapin microsoft.exchange.management.powershell.Snapin
$banner_exchange="  ____             __          ______          _                            
 |  _ \           /_/         |  ____|        | |                           
 | |_) |_   _ _______  _ __   | |__  __  _____| |__   __ _ _ __   __ _  ___ 
 |  _ <| | | |_  / _ \| '_ \  |  __| \ \/ / __| '_ \ / _' | '_ \ / _' |/ _ \
 | |_) | |_| |/ / (_) | | | | | |____ >  < (__| | | | (_| | | | | (_| |  __/
 |____/ \__,_/___\___/|_| |_| |______/_/\_\___|_| |_|\__,_|_| |_|\__, |\___|
                                                                  __/ |     
                                                                 |___/      "
$banner_o365="  ____             __           ____ ____    __ _____ 
 |  _ \           /_/          / __ \___ \  / /| ____|
 | |_) |_   _ _______  _ __   | |  | |__) |/ /_| |__  
 |  _ <| | | |_  / _ \| '_ \  | |  | |__ <| '_ \___ \ 
 | |_) | |_| |/ / (_) | | | | | |__| |__) | (_) |__) |
 |____/ \__,_/___\___/|_| |_|  \____/____/ \___/____/ "
$banner_sinbuzon="   _____ _         _                __        
  / ____(_)       | |              /_/        
 | (___  _ _ __   | |__  _   _ _______  _ __  
  \___ \| | '_ \  | '_ \| | | |_  / _ \| '_ \ 
  ____) | | | | | | |_) | |_| |/ / (_) | | | |
 |_____/|_|_| |_| |_.__/ \__,_/___\___/|_| |_|"
$banner_sinAD="  _   _                   _     _                               _____  
 | \ | |                 (_)   | |                        /\   |  __ \ 
 |  \| | ___     _____  ___ ___| |_ ___    ___ _ __      /  \  | |  | |
 | . ' |/ _ \   / _ \ \/ / / __| __/ _ \  / _ \ '_ \    / /\ \ | |  | |
 | |\  | (_) | |  __/>  <| \__ \ ||  __/ |  __/ | | |  / ____ \| |__| |
 |_| \_|\___/   \___/_/\_\_|___/\__\___|  \___|_| |_| /_/    \_\_____/ "
do {
  cls
  $aliasAD = Read-Host -Prompt "Introduce el alias de AD del usuario (sin @vithas.es)"
  $dominio= "@vithases.mail.onmicrosoft.com"
  $mailbox= $aliasAD + $dominio
  $ad_user=$null
  $buzon_o365=$null
  $buzon_exchange=$null
  $ad_user=Get-ADUser -Identity $aliasAD -erroraction 'silentlycontinue'
  $buzon_o365=Get-RemoteMailbox -Identity $aliasAD -erroraction 'silentlycontinue'
  $buzon_exchange=Get-Mailbox -Identity $aliasAD -erroraction 'silentlycontinue'
  do {
      cls
      if ($buzon_exchange) {
        Write-Host "Usuario: " -NoNewline
        Write-Host "$aliasAD - $buzon_exchange" -ForegroundColor yellow
        write-output $banner_exchange
      } elseif ($buzon_o365) {
        Write-Host "Usuario: " -NoNewline
        Write-Host "$aliasAD - $buzon_o365" -ForegroundColor yellow
        write-output $banner_o365
      } elseif ($ad_user) {
        Write-Host "Usuario: " -NoNewline
        Write-Host "$aliasAD" -ForegroundColor yellow
        write-output $banner_sinbuzon
      } else {
        Write-Host "Usuario: " -NoNewline
        Write-Host "$aliasAD" -ForegroundColor yellow
        write-output $banner_sinAD
      }

      if ($buzon_exchange) {
        if ($accion -eq "1") {
  	      Get-Mailbox $aliasAD | fl database
        } elseif ($accion -eq "2") {
  	      New-MoveRequest $aliasAD -TargetDatabase bajasvithas -BadItemLimit 1000 -AcceptLargeDataLoss
        } elseif ($accion -eq "3") {
  	      Get-MoveRequestStatistics $aliasAD | ft -autosize
        }
      } elseif (($ad_user) -and (-not $buzon_o365)) {
        if ($accion -eq "1") {
            Try {
                Write-Output "Inicio de la ejecución"
                Enable-RemoteMailbox -Identity $aliasAD -RemoteRoutingAddress $mailbox -ea Continue
            }
                        Catch{
                Write-Warning "`nSe ha producido un error en la ejecución, escalar incidencia con pantallazo del error"
                $_.exception.Message
            }
            Finally {
                Write-Output "`nFin de la ejecución, en caso de detectar algun error escalar incidencia con el pantallazo "
            }        }
      }

      write-output " _______________________________"
      Write-Output "/           Ordenes             \"
      Write-Output "|                               |"
      if ($buzon_exchange) {
      Write-Output "| 1 - Ver BBDD actual           |"
      Write-Output "| 2 - Mover a bajas             |"
      Write-Output "| 3 - Ver progreso movimiento   |"
      } elseif (($ad_user) -and (-not $buzon_o365)) {
      Write-Output "| 1 - Crear buzón O365          |"
      }
      Write-Output "|                               |"
      Write-Output "| 9 - Repetir para otro usuario |"
      Write-Output "| 0 - Salir                     |"
      Write-Output "\_______________________________/"
      Write-Output ""
      $accion = Read-Host -Prompt "Por favor, introduce la orden"
  } while (($accion -ne "9") -and ($accion -ne "0"))
} while ($accion -ne "0")
