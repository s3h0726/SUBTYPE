# SUBTYPE — Japan's 16 major private-railway station sign references

This is a CSS-based **photo-informed interpretation**, not a certified reproduction of
each operator's current sign standard. Real signs vary by station, generation,
branch, installation type, and time. Reference photographs are not bundled,
re-hosted, or embedded. No official operator or line logo is displayed in-game.
Station numbering remains because **station numbers are text/navigation**, not logos.

Official membership: Japan Private Railway Association,
https://www.mintetsu.or.jp/corporates/ (16 leading private railways).

| Operator (Japanese) | SUBTYPE sign selector | Observed layout and visual reference |
|---|---|---|
| 東武鉄道 | tobu | White face, orange-red rail ribbon — https://4travel.jp/dm_shisetsu/10027552 |
| 西武鉄道 | seibu | White header, blue lower field — https://www4.hp-ez.com/hp/prstationsign/page17 |
| 京成電鉄 | keisei | White face, blue fine line, KS circular code — https://4travel.jp/dm_shisetsu/10027716 |
| 京王電鉄 | keio | White board, burgundy/charcoal double stripe — https://www.keio.co.jp/global/howto/railwaymap/ |
| 小田急電鉄 | odakyu (existing photo board) | Ivory-white, blue arrow band — https://blog.livedoor.jp/niaszs2007-hatst_r/archives/48458943.html |
| 東急電鉄 | tokyu (existing photo board) | Charcoal face, strong line-color stripe — https://ekimeihyo.net/e/tokyu/toyoko.php |
| 京浜急行電鉄 | keikyu | White on cobalt/navy with round KK marker — https://bunshun.jp/articles/-/54161 |
| 東京地下鉄 | metro (existing photo board) | White main station name, route-color lower band — https://ekikabe.net/m10 |
| 相模鉄道 | sotetsu | Blue face, white lettering, orange divider — https://ekimeihyo.net/e/sotetsu/izumino.php |
| 名古屋鉄道 | meitetsu | White face, teal/pink/navy tricolor ribbon — https://www4.hp-ez.com/hp/prstationsign/page91 |
| 近畿日本鉄道 | kintetsu | White face, black Romanization bar — https://ekimeihyo.net/e/kintetsu/osaka.php |
| 南海電気鉄道 | nankai | White, black NK code circle, slate/line-color bar — https://www.nankai.co.jp/community/station/misakikoen.html |
| 京阪電気鉄道 | keihan | White on rich blue with white arrow band — https://note.com/ida_note/n/n4e6387e0e35a |
| 阪急電鉄 | hankyu | Charcoal gray, larger kana than kanji, circular HK code — https://ekimeihyo.net/e/hankyu/takarazuka.php |
| 阪神電気鉄道 | hanshin | Blue panel, white divider and HS circle — https://ameblo.jp/sdm48hikari/entry-12581178814.html |
| 西日本鉄道 | data-operator-id=nishinihontetsudo | White face, blue lettering and red arrows — https://xyhigashi.hatenablog.jp/entry/20250311/1741702038 |

## Integration

- Styles in `css/japan-major-private-nameplates.css` are loaded **after** existing
  operator CSS. This avoids broad changes to other countries or JR lines.
- No data or station sequences are changed, and station names remain dynamic DOM text.
- The original Tokyu, Odakyu and Tokyo Metro photo styles take precedence.
- Nishitetsu needs an operator-ID selector because the current game resolver
  maps it to `operator-private`, not a distinct `nishitetsu` sign family.
- All branding marks are hidden **only in the station nameplate**, not automatically
  elsewhere in the UI. Existing Tokyo and Japanese special-line templates survive.
- Verify both standard service and free-drive with a Korean IME; touch keyboards
  should be tested separately because the hidden input paradigm pre-dates this change.
