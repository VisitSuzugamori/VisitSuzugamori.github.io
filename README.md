# VisitSuzugamori

これは、当方が公開している「ざつ旅」ファンサイトの、リポジトリです。
ご意見やご感想、その他メッセージがありましたら、「[Issues](https://github.com/VisitSuzugamori/VisitSuzugamori.github.io/issues)」か、「[Discussions](https://github.com/VisitSuzugamori/VisitSuzugamori.github.io/discussions)」までお寄せください。（基本的に公開されます。）
または私（isnot）個人宛（TwitterのDM等）にお願します。

## Note

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

zatsumap.kml は、「ざつ旅マップ」からエクスポートしたものです。

scriptsフォルダ内に、コンテンツ生成用のスクリプトがあります。
`$ npm run build` でコンテンツ生成します。

## Author

- @isnot

## Copyright and License 免責

- [ざつ旅-That's Journey-](https://store.kadokawa.co.jp/shop/b/bM1394_dD/) Copyright (c) 石坂 ケンタ, KADOKAWA, 電撃マオウ
- [ざつ旅マップ](https://t.co/Y8vwKzd1xD) by [ホ​ーリー提督 @Holly_carp_10](https://twitter.com/Holly_carp_10/status/1315987383695728642)
- [mapbox/storytelling](https://github.com/mapbox/storytelling) Copyright (c) 2019, Mapbox All rights reserved.

当サイトで掲載しているコンテンツ（画像やツイート、等）には、他者が所有しているものが含まれます。それらは、それぞれの権利保有者のものです。
当サイトでは、「引用」の範囲内であることを意図して、利用しております。

著作権や肖像権の侵害を目的としたものではありません。著作権や肖像権に関して問題がございましたら、ご連絡ください。迅速に対応いたします。
ご連絡には、当GitHubリポジトリーの「Issues」、「Discussions」、または私（isnot）個人宛（TwitterのDM等）をご利用ください。
