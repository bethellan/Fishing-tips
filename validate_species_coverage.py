#!/usr/bin/env python3
import argparse, json, sys

def load_species(species_file):
  with open(species_file,'r',encoding='utf-8') as f:
    data=json.load(f)
  names=set(sp['commonName'] for sp in data.get('species',[]))
  return names,data

def load_spots(spots_file):
  with open(spots_file,'r',encoding='utf-8') as f:
    data=json.load(f)
  if isinstance(data,list): return data
  if isinstance(data,dict) and data.get('type')=='FeatureCollection':
    out=[]; 
    for feat in data.get('features',[]):
      props=feat.get('properties',{})
      if props.get('type')=='spot': out.append(props)
    return out
  return []

def main():
  ap=argparse.ArgumentParser(description='Check species coverage for Wellington & West Coast')
  ap.add_argument('--spots-file', required=True)
  ap.add_argument('--species-file', required=True)
  args=ap.parse_args()

  master_names, master = load_species(args.species_file)
  regions_focus = set(master.get('regions',[]))

  arr = load_spots(args.spots_file)
  seen_by_region={r:set() for r in regions_focus}

  for s in arr:
    reg = s.get('region','Other')
    if reg not in regions_focus: continue
    for nm in (s.get('targetSpecies') or []):
      nm = nm.strip()
      if nm: seen_by_region[reg].add(nm)

  print('=== Species Coverage Report (Wellington & West Coast) ===')
  for region in master.get('regions',[]):
    want=set(sp['commonName'] for sp in master.get('species',[]) if region in sp.get('regions',[]))
    have=seen_by_region.get(region,set())
    missing=sorted(list(want-have))
    print(f'\\nRegion: {region}')
    print(f'  Covered: {len(have)}/{len(want)}')
    if missing:
      print('  Missing:'); 
      for m in missing: print('   -', m)
    else:
      print('  ✅ All covered here.')

if __name__=='__main__':
  main()
