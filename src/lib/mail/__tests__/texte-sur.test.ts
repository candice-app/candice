import { describe, it, expect } from 'vitest';
import { prenomSur, echapperHtml } from '../texte-sur';

describe('un prénom écrit par un autre n’entre pas tel quel dans un courriel', () => {
  it('garde un prénom ordinaire', () => {
    expect(prenomSur('Élodie Martin')).toBe('Élodie');
    expect(prenomSur('Jean-Baptiste')).toBe('Jean-Baptiste');
    expect(prenomSur("N'Golo")).toBe("N'Golo");
  });
  it('retire balises, liens et ponctuation', () => {
    expect(prenomSur('<a href="http://mal.example">Paul</a>')).toBe('a');
    expect(prenomSur('<b>Paul</b>')).toBe('bPaulb');
    expect(prenomSur('mal.example/gagne')).toBe('malexamplegagne');
    expect(prenomSur('Paul<script>')).toBe('Paulscript');
  });
  it('jamais de chevron, de point, de barre ni de guillemet en sortie', () => {
    for (const brut of ['<img src=x onerror=1>', 'http://a.b/c', '"\'><svg/onload=1>', 'a.b.c', 'x@y.z']) {
      expect(prenomSur(brut) ?? '').not.toMatch(/[<>./"@:=]/);
    }
  });
  it('rien d’utilisable → null', () => {
    expect(prenomSur('')).toBeNull(); expect(prenomSur('   ')).toBeNull();
    expect(prenomSur('1234')).toBeNull(); expect(prenomSur(null)).toBeNull(); expect(prenomSur('---')).toBeNull();
  });
  it('trente lettres au plus', () => expect(prenomSur('a'.repeat(200))!.length).toBe(30));
});

describe('un texte libre dans un courriel', () => {
  it('ne peut plus ouvrir de balise', () => {
    expect(echapperHtml('<a href="x">y</a> & co')).toBe('&lt;a href=&quot;x&quot;&gt;y&lt;/a&gt; &amp; co');
    expect(echapperHtml(null)).toBe('');
  });
});
