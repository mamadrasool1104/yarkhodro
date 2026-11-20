/* ===== Vehicle catalog (VehicleModel + schedule data) =====
   Each interval carries a `source`. Items without an interval stay "unknown"
   until the user enters the value from the car's own service booklet. */
const SRC_FARARU='فرارو؛ هزینه تعمیرات پراید ۱۴۰۴ (منبع عمومی پراید، نه دفترچه‌ی اختصاصی)';
const SRC_DIGI='دیجی‌کالا مگ؛ بهترین زمان تعویض تسمه تایم';
const BASE_ITEMS=[
 {key:'oil',name:'تعویض روغن موتور'},{key:'oil-filter',name:'فیلتر روغن'},{key:'air',name:'فیلتر هوا'},
 {key:'plugs',name:'شمع'},{key:'brakes',name:'بازدید لنت و دیسک ترمز'},{key:'brake-fluid',name:'روغن ترمز'},
 {key:'coolant',name:'مایع خنک‌کننده'},{key:'battery',name:'باتری'},{key:'timing',name:'تسمه تایم'},{key:'tires',name:'لاستیک'}];
const CATALOG=[
 {id:'saipa-saba',brand:'سایپا',model:'پراید صبا',defaultYear:1389,overrides:{
  oil:{intervalKm:5000,source:SRC_FARARU,note:'بازه‌ی منبع ۵ تا ۶ هزار کیلومتر است؛ حد پایین انتخاب شد.'},
  'oil-filter':{intervalKm:5000,source:SRC_FARARU,note:'همراه تعویض روغن.'},
  plugs:{intervalKm:20000,source:SRC_FARARU,note:'بازه‌ی منبع ۲۰ تا ۳۰ هزار کیلومتر است؛ حد پایین انتخاب شد.'},
  timing:{intervalKm:60000,intervalMonths:60,source:SRC_FARARU+' و '+SRC_DIGI,note:'حداکثر ۶۰ هزار کیلومتر؛ عمر تسمه حداکثر ۵ سال.'}}},
 {id:'ikco-pars',brand:'ایران‌خودرو',model:'پژو پارس',defaultYear:1395,overrides:{
  timing:{intervalKm:70000,intervalMonths:60,source:SRC_DIGI+' (جدول پژو ۴۰۵/پارس TU5)',note:'اگر موتور شما XU7 است، با دفترچه تطبیق دهید.'}}}
];
