#!/usr/bin/env python3
"""Maaltijdrekenaar: koolhydraten in een gemengde avondmaaltijd, gerekend in 'portiegram'.

1 portiegram = 1 g ongekookt graanproduct (droge pasta, rijst, couscous, noedels).
Grens per avondmaaltijd (dietist-PDF): 75-100 g ongekookt = 200-250 g gekookt.
Andere producten tellen naar rato van hun koolhydraten: kh per 100 g / 70.

Voorbeelden:
  bereken.py --item bladerdeeg:188 --item aardappel_rauw:190
  bereken.py --item bladerdeeg:188 --zoek aardappel_rauw
  bereken.py --item bladerdeeg:188 --item aardappel_rauw:190 --gewicht 1650 --stukken 8
  bereken.py --item "linzenpasta:150:52"        (eigen product: naam:gram:kh_per_100g)
"""
import argparse, math, sys

REF_KH = 70.0          # kh per 100 g droog graanproduct (referentie)
DOEL, MAX = 75.0, 100.0  # portiegram per persoon bij het avondeten
GEKOOKT = 0.4          # 1 g gekookt graan = 0,4 portiegram (250 g gekookt = 100 g droog)

# naam: (factor portiegram per gram, uitleg)
P = {
  'pasta_droog':(1,'pasta droog'), 'pasta_gekookt':(GEKOOKT,'pasta gekookt'),
  'volkoren_rijst_droog':(1,'volkoren rijst droog'), 'volkoren_rijst_gekookt':(GEKOOKT,'volkoren rijst gekookt'),
  'japanse_rijst_droog':(1,'Japanse rijst droog'), 'japanse_rijst_gekookt':(GEKOOKT,'Japanse rijst gekookt'),
  'couscous_droog':(1,'couscous droog'), 'couscous_gekookt':(GEKOOKT,'couscous gewel'),
  'soba_droog':(1,'soba droog'), 'ramen_droog':(1,'ramen droog'), 'udon_droog':(1,'udon droog'),
  'noedels_gekookt':(GEKOOKT,'noedels gekookt'),
  'udon_voorgekookt':(22/REF_KH,'udon voorgekookt (vacuümpak, ±22 g kh/100 g)'),
  'bladerdeeg':(36/REF_KH,'bladerdeeg (±36 g kh/100 g)'),
  'aardappel_rauw':(15/REF_KH,'aardappel rauw (±15 g kh/100 g)'),
  'aardappel_gekookt':(15/REF_KH,'aardappel gekookt (±15 g kh/100 g)'),
  'zoete_aardappel_rauw':(17/REF_KH,'zoete aardappel rauw (±17 g kh/100 g)'),
  'zoete_aardappel_gekookt':(17/REF_KH,'zoete aardappel gekookt (±17 g kh/100 g)'),
  'volkoren_wrap':(45/REF_KH,'volkoren wrap (±45 g kh/100 g; klein ±40 g, groot ±70 g)'),
}

def f(x):
    return (f"{x:.0f}" if abs(x-round(x))<0.05 else f"{x:.1f}").replace('.',',')

def item(s):
    parts=s.split(':')
    naam=parts[0].strip().lower().replace(' ','_').replace('-','_')
    gram=float(parts[1].replace(',','.')) if len(parts)>1 and parts[1] else None
    if len(parts)>2:
        kh=float(parts[2].replace(',','.')); return naam,gram,kh/REF_KH,f"{naam} (eigen waarde {f(kh)} g kh/100 g)"
    if naam not in P: sys.exit(f"Onbekend product '{naam}'. Kies uit: {', '.join(sorted(P))}, of geef naam:gram:kh_per_100g.")
    return naam,gram,P[naam][0],P[naam][1]

a=argparse.ArgumentParser()
a.add_argument('--item',action='append',default=[],help='naam:gram of naam:gram:kh_per_100g')
a.add_argument('--aandeel',type=float,default=0.6,help='jouw deel van het gerecht (standaard 0,6)')
a.add_argument('--zoek',help='product waarvan je wilt weten hoeveel je mag toevoegen (naam of naam::kh)')
a.add_argument('--gewicht',type=float,help='gewicht van het hele gerecht na bereiden, in gram')
a.add_argument('--stukken',type=int,help='in hoeveel gelijke stukken het gerecht gesneden wordt')
a.add_argument('--plaatje',help='bestandsnaam voor een plaatje van de bakvorm (svg), bijv. quiche.svg')
a.add_argument('--vorm',choices=['rechthoek','rond'],default='rechthoek',help='bakplaat (rechthoek) of taartvorm (rond)')
a.add_argument('--naam',default='Gerecht',help='naam van het gerecht voor in het plaatje')
a.add_argument('--schaal',choices=['ovenschaal28'],help='vaste bakvorm: ovenschaal28 = Dille & Kamille ovenschaal 28 x 15 cm')
r=a.parse_args()
SCHALEN={'ovenschaal28':{'vorm':'rechthoek','l':28,'b':15,'naam':'ovenschaal 28 × 15 cm','stukken':8}}
SCH=SCHALEN.get(r.schaal)
if SCH:
    r.vorm=SCH['vorm']
    if not r.stukken: r.stukken=SCH['stukken']
s=r.aandeel
items=[item(x) for x in r.item]
tot=sum(g*fac for _,g,fac,_ in items if g)
print(f"Jouw deel: {f(s*100)}% · grens per avondmaaltijd: {f(DOEL)}–{f(MAX)} portiegram (= {f(DOEL)}–{f(MAX)} g ongekookt of {f(DOEL/GEKOOKT)}–{f(MAX/GEKOOKT)} g gekookt graanproduct)\n")
print("Koolhydraten in het hele gerecht:")
for n,g,fac,u in items:
    if g: print(f"  {u}: {f(g)} g = {f(g*fac)} portiegram")
print(f"  Totaal: {f(tot)} portiegram · jouw deel {f(tot*s)}\n")

if r.zoek:
    n,_,fac,u=item(r.zoek if ':' in r.zoek else r.zoek+':')
    ruimte_max=MAX/s-tot; ruimte_doel=DOEL/s-tot
    print(f"VRAAG 1 · Hoeveel {u.split(' (')[0]} mag erbij?")
    if ruimte_max<=0:
        print(f"  Niets meer: jouw deel is zonder {u.split(' (')[0]} al {f(tot*s)} portiegram (max {f(MAX)}).")
    else:
        lo=max(0,ruimte_doel)/fac; hi=ruimte_max/fac
        print(f"  Voor het hele gerecht: {f(lo)}–{f(hi)} g · advies hoogstens {f(math.floor(hi/10)*10)} g")
        print(f"  (dan krijg jij {f(DOEL)}–{f(MAX)} portiegram binnen met {f(s*100)}% van het gerecht)")
    print()

def svg(n,neem,vorm,naam,mijn_pg):
    G,O,L,T='#2fb45d','#e9edf1','#9aa3ab','#101418'
    W,H=640,520
    sub=naam+(' · '+SCH['naam'] if SCH else '')
    out=[f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" font-family="Arial,Helvetica,sans-serif">',
         f'<rect width="{W}" height="{H}" fill="#fff"/>',
         f'<text x="{W/2}" y="52" text-anchor="middle" font-size="40" font-weight="700" fill="{T}">Neem {neem} van de {n} stukken</text>',
         f'<text x="{W/2}" y="86" text-anchor="middle" font-size="22" fill="#4a5158">{sub}</text>']
    if vorm=='rechthoek':
        rows=1 if n<=3 else 2 if n<=10 else 3 if n<=15 else 4
        cols=math.ceil(n/rows); x0,y0,w,h=40,120,W-80,H-160
        if SCH:
            ar=SCH['l']/SCH['b']; h2=min(h,w/ar); y0+= (h-h2)/2; h=h2
            out.append(f'<text x="{W/2}" y="{y0+h+44}" text-anchor="middle" font-size="22" fill="#4a5158">Elk stuk ±{f(SCH["l"]/cols)} × {f(SCH["b"]/rows)} cm · groen = jouw stukken</text>')
        out.append(f'<rect x="{x0-10}" y="{y0-10}" width="{w+20}" height="{h+20}" rx="18" fill="#c9cfd5"/>')
        cw,ch=w/cols,h/rows
        for i in range(n):
            r_,c=divmod(i,cols); x,y=x0+c*cw,y0+r_*ch; mine=i<neem
            out.append(f'<rect x="{x+3}" y="{y+3}" width="{cw-6}" height="{ch-6}" rx="10" fill="{G if mine else O}"/>')
            out.append(f'<text x="{x+cw/2}" y="{y+ch/2+16}" text-anchor="middle" font-size="44" font-weight="700" fill="{"#fff" if mine else L}">{i+1 if mine else ""}</text>')
    else:
        cx,cy,R=W/2,120+(H-150)/2,(H-160)/2
        out.append(f'<circle cx="{cx}" cy="{cy}" r="{R+10}" fill="#c9cfd5"/>')
        for i in range(n):
            a1=-math.pi/2+2*math.pi*i/n; a2=-math.pi/2+2*math.pi*(i+1)/n; mine=i<neem
            x1,y1,x2,y2=cx+R*math.cos(a1),cy+R*math.sin(a1),cx+R*math.cos(a2),cy+R*math.sin(a2)
            big=1 if a2-a1>math.pi else 0
            out.append(f'<path d="M{cx},{cy} L{x1:.1f},{y1:.1f} A{R},{R} 0 {big} 1 {x2:.1f},{y2:.1f} Z" fill="{G if mine else O}" stroke="#fff" stroke-width="6"/>')
            am=(a1+a2)/2
            if mine: out.append(f'<text x="{cx+R*.62*math.cos(am):.1f}" y="{cy+R*.62*math.sin(am)+15:.1f}" text-anchor="middle" font-size="40" font-weight="700" fill="#fff">{i+1}</text>')
    out.append('</svg>')
    return ''.join(out)

mijn=tot*s
status = 'te weinig' if mijn<DOEL else ('binnen je grens ✓' if mijn<=MAX else f'{f(mijn-MAX)} portiegram te veel ✗')
print(f"CONTROLE · met {f(s*100)}% van het gerecht krijg jij {f(mijn)} portiegram: {status}")
if tot>0:
    fr_max=min(1,MAX/tot); fr_doel=min(1,DOEL/tot)
    print(f"VRAAG 2 · Hoeveel mag je opscheppen?")
    print(f"  Je mag {f(fr_doel*100)}–{f(fr_max*100)}% van het hele gerecht nemen.")
    if r.gewicht: print(f"  Weeg je bord: {f(fr_doel*r.gewicht)}–{f(fr_max*r.gewicht)} g van de {f(r.gewicht)} g.")
    if r.stukken:
        n=r.stukken; mx=fr_max*n; mn=fr_doel*n
        neem=math.ceil(mn-1e-9) if math.ceil(mn-1e-9)<=mx+1e-9 else math.floor(mx+1e-9)
        print(f"  Bij {n} gelijke stukken: NEEM {neem} STUK{'KEN' if neem!=1 else ''} (mag tussen {f(mn)} en {f(mx)}).")
        if r.plaatje:
            open(r.plaatje,'w').write(svg(n,neem,r.vorm,r.naam,mijn_pg=tot*neem/n))
            print(f"  Plaatje: {r.plaatje}")
    if r.gewicht:
        if r.stukken: doel_g=r.gewicht*neem/r.stukken
        else: doel_g=r.gewicht*(fr_doel+fr_max)/2
        doel_g=min(doel_g, r.gewicht*fr_max)
        print(f"  WEEGSCHAAL · zet je bord op de weegschaal, druk op 0 en schep tot {f(round(doel_g/10)*10)} g.")
