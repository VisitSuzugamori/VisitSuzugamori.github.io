const config = {
  style: 'mapbox://styles/isnot/ckdzfj1n70ee219lhgygiamwc',
  accessToken: 'pk.eyJ1IjoiaXNub3QiLCJhIjoiY2tscDdpeGExMHp5cTJwcXI0YWlzZHdyeCJ9._NooEseBc8wEwa3z_plcAg',
  showMarkers: true,
  markerColor: '#3FB1CE',
  theme: 'light',
  use3dTerrain: true,
  title: 'VisitSuzugamori ###journey###',
  subtitle: '【###journey###】',
  byline: '地図作成 isnot',
  footer: 'ざつ旅-That&#39;s Journey- (c) 石坂 ケンタ, KADOKAWA, 電撃マオウ / Mapbox',
  chapters: [
    {
      id: '###book###-###page###-###name###',
      alignment: 'left',
      hidden: false,
      title: '###name###',
      image: '',
      description: '###book### ###page### ###special###',
      location: {
        center: [###coordinates###],
        zoom: 13,
        pitch: 60,
        bearing: 0,
      },
      mapAnimation: 'flyTo',
      rotateAnimation: false,
      callback: '',
      onChapterEnter: [
        // {
        //     layer: 'layer-name',
        //     opacity: 1,
        //     duration: 5000
        // }
      ],
      onChapterExit: [
        // {
        //     layer: 'layer-name',
        //     opacity: 0
        // }
      ],
    },
  ],
};
