const config = {
  style: 'mapbox://styles/isnot/ckdzfj1n70ee219lhgygiamwc',
  accessToken: 'pk.eyJ1IjoiaXNub3QiLCJhIjoiY2tscDdpeGExMHp5cTJwcXI0YWlzZHdyeCJ9._NooEseBc8wEwa3z_plcAg',
  showMarkers: true,
  markerColor: '#3FB1CE',
  theme: 'light',
  use3dTerrain: true,
  title: 'VisitSuzugamori 第14旅',
  subtitle: '【14】',
  byline: '地図作成 isnot',
  footer: 'ざつ旅-That&#39;s Journey- (c) 石坂 ケンタ, KADOKAWA, 電撃マオウ / Mapbox',
  chapters: [
    {
      id: 'tj14-tokyo-station',
      alignment: 'left',
      hidden: false,
      title: '東京駅',
      // image: '',
      description: '4巻P93 ',
      location: {
        center: [139.76733857670646, 35.68242691678407],
        zoom: 8.5,
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
