# VisitSuzugamori

これは、当方が公開している「ざつ旅」ファンサイトの、リポジトリです。
ご意見やご感想、その他メッセージがありましたら、「[Issues](https://github.com/VisitSuzugamori/VisitSuzugamori.github.io/issues)」か、「[Discussions](https://github.com/VisitSuzugamori/VisitSuzugamori.github.io/discussions)」までお寄せください。（基本的に公開されます。）
または私（isnot）個人宛（TwitterのDM等）にお願します。

## Note

このリポジトリにあるスクリプトを利用して、[当サイト](https://VisitSuzugamori.github.io/)のコンテンツを生成するための手順などを、ごく簡単に記します。

### 事前の準備

Node.js（バージョン12以降推奨）が必要です。

また、依存するライブラリを導入するには、次のようにします。`$ npm install`

`my_secret.json` に、各APIを利用するうえでのシークレット（`access_token`等）を保存します。
雛形（一例）を下記に示します。

```json
{
  "twitter_dev": {
    "consumer_key": "",
    "consumer_secret": "",
    "access_token": "",
    "token_secret": "",
    "bearer_token": ""
  },
  "mapbox": {
    "access_token": ""
  },
  "flickr": {
    "flickr_key": ""
  }
}
```

### コンテンツの生成

`zatsumap.kml` は、「ざつ旅マップ」からエクスポートしたものです。

`scripts`フォルダ内に、コンテンツ生成用のスクリプトがあります。
`$ npm run build` でコンテンツ生成します。

## Author

- [@isnot](https://github.com/isnot)

## Copyright and License 免責

- [ざつ旅-That's Journey-](https://dengekimaoh.jp/series_info/zatsutabi/) Copyright (c) 石坂 ケンタ, KADOKAWA, 電撃マオウ
- [ざつ旅マップ](https://t.co/Y8vwKzd1xD) by [ホ​ーリー提督 @Holly_carp_10](https://twitter.com/Holly_carp_10/status/1315987383695728642)
- [mapbox/storytelling](https://github.com/mapbox/storytelling) Copyright (c) 2019, Mapbox All rights reserved.
- [農研機構](https://aginfo.cgk.affrc.go.jp/) ※[簡易逆ジオコーディングサービス](https://aginfo.cgk.affrc.go.jp/rgeocode/index.html.ja) の出力結果を加工して利用しています

### 「農研機構 簡易逆ジオコーディングサービス」に由来する、所在地住所の表記に関して

各地点における「番地情報（※住所表記の末尾にある数字部分）」は、実態と異なる場合があり、またプライバシーにも関わることがありますので、特に慎重に扱って下さい。

### 「Twitter」および「Flickr」に由来する、画像、動画やテキスト、またそれらの付属情報に関して

当サイトで掲載しているコンテンツ（画像やツイート、等）には、他者が所有しているものが含まれます。それらは、それぞれの権利保有者のものです。
当サイトでは、「引用」の範囲内であることを意図して、利用しております。

著作権や肖像権の侵害を目的としたものではありません。著作権や肖像権に関して問題がございましたら、ご連絡ください。迅速に対応いたします。

### 当サイトおよびそのコンテンツ全般に関して

ご連絡には、当GitHubリポジトリの「Issues」、「Discussions」、または私（isnot）個人宛（TwitterのDM等）をご利用ください。

当サイトは、当該サービスを無保証で提供しており、当該サービスが原因で発生した損害等について、補償等は一切おこないません。
当サイトは、当該サービスを原因とする不具合があった場合でも、成果物に関する直接的なサポートを行いません。
当サイトのコンテンツは、予告なく変更、移転、削除等が行われることがあります。
