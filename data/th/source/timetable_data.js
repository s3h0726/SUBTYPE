// timetable_data.js
// ไฟล์เก็บข้อมูลค่าคงที่สำหรับ Frontend (Language, Word Map, Train Details)

// --- [NEW] ข้อมูลวันเดินรถ (Train Running Days) ---
// type: 'everyday' (ทุกวัน), 'weekday' (จ-ศ), 'weekend' (ส-อา/วันหยุด), 'special' (เฉพาะช่วง)
const trainRunningDays = {
    // สายตะวันออก (ตัวอย่าง)
    '997': { text: { th: 'เสาร์-อาทิตย์', en: 'Sat - Sun' }, type: 'weekend' },
    '998': { text: { th: 'เสาร์-อาทิตย์', en: 'Sat - Sun' }, type: 'weekend' },

    // สายเหนือ 
    '313': { text: { th: 'เฉพาะวันทำงาน', en: 'Workdays Only' }, type: 'weekday' },
    '314': { text: { th: 'เฉพาะวันทำงาน', en: 'Workdays Only' }, type: 'weekday' },
    '317': { text: { th: 'เฉพาะวันทำงาน', en: 'Workdays Only' }, type: 'weekday' },
    '318': { text: { th: 'เฉพาะวันทำงาน', en: 'Workdays Only' }, type: 'weekday' },
    '405': { text: { th: 'งดเดิน', en: 'Cancelled' }, type: 'special' },
    '406': { text: { th: 'งดเดิน', en: 'Cancelled' }, type: 'special' },
	
	// Kiha40/43
    '9001': { text: { th: 'เฉพาะวันทำงาน', en: 'Weekday Only' }, type: 'weekday' },
	'9003': { text: { th: 'เฉพาะวันหยุด', en: 'Holiday Only' }, type: 'weekend' },
	'9005': { text: { th: 'ทุกวัน', en: 'Everyday' }, type: 'weekday' },
	'9007': { text: { th: 'เฉพาะวันหยุด', en: 'Holiday Only' }, type: 'weekend' },
	'9009': { text: { th: 'เฉพาะวันทำงาน', en: 'Weekday Only' }, type: 'weekday' },
	'9011': { text: { th: 'ทุกวัน', en: 'Everyday' }, type: 'Daily' },
	
    '9002': { text: { th: 'เฉพาะวันทำงาน', en: 'Weekday Only' }, type: 'weekday' },
	'9006': { text: { th: 'เฉพาะวันหยุด', en: 'Holiday Only' }, type: 'weekend' },
    '9008': { text: { th: 'ทุกวัน', en: 'Everyday' }, type: 'weekday' },
	'9010': { text: { th: 'ทุกวัน', en: 'Everyday' }, type: 'weekday' },
	'9012': { text: { th: 'ทุกวัน', en: 'Everyday' }, type: 'weekday' },
    
    
    // สายตะวันออกเฉียงเหนือ 
    '339': { text: { th: 'เฉพาะวันทำงาน', en: 'Workdays Only' }, type: 'weekday' },
    '340': { text: { th: 'เฉพาะวันทำงาน', en: 'Workdays Only' }, type: 'weekday' },
	
	// สายใต้ 
    '173': { text: { th: 'เริ่ม 15 พย.69', en: 'GO:15/05/2026' }, type: 'weekday' },
    '174': { text: { th: 'เริ่ม 15 พย.69', en: 'GO:15/05/2026' }, type: 'weekday' },
    
    // สายท่องเที่ยว
    '909': { text: { th: 'เสาร์-อาทิตย์', en: 'Sat - Sun' }, type: 'weekend' },
    '910': { text: { th: 'เสาร์-อาทิตย์', en: 'Sat - Sun' }, type: 'weekend' },
    '911': { text: { th: 'เสาร์-อาทิตย์', en: 'Sat - Sun' }, type: 'weekend' },
    '912': { text: { th: 'เสาร์-อาทิตย์', en: 'Sat - Sun' }, type: 'weekend' },
    
    // รถปรับอากาศ (มหาชัย-วงเวียนใหญ่)
    '4320': { text: { th: 'ปรับอากาศ', en: 'Air-con' }, type: 'aircon' },
    '4321': { text: { th: 'ปรับอากาศ', en: 'Air-con' }, type: 'aircon' },
    '4322': { text: { th: 'ปรับอากาศ', en: 'Air-con' }, type: 'aircon' },
    '4323': { text: { th: 'ปรับอากาศ', en: 'Air-con' }, type: 'aircon' },
    '4326': { text: { th: 'ปรับอากาศ', en: 'Air-con' }, type: 'aircon' },
    '4327': { text: { th: 'ปรับอากาศ', en: 'Air-con' }, type: 'aircon' },
    '4328': { text: { th: 'ปรับอากาศ', en: 'Air-con' }, type: 'aircon' },
    '4329': { text: { th: 'ปรับอากาศ', en: 'Air-con' }, type: 'aircon' }
};

// 1. ข้อมูลภาษา (Internationalization)
const i18n = {
    th: {
        title: "ตารางกำหนดเวลาเดินรถ :",
        loading: "กำลังโหลดข้อมูล...",
        lines: {
            1: "สายเหนือ", 2: "สายตะวันออกเฉียงเหนือ", 3: "สายตะวันออก",
            4: "สายใต้", 5: "สายวงเวียนใหญ่ - มหาชัย", 6: "สายบ้านแหลม - แม่กลอง"
        },
        trips: { 1: "เที่ยวไป", 2: "เที่ยวกลับ" },
        remark_title: "หมายเหตุ",
        remarks: [
            "เวลาการเดินรถอาจมีการเปลี่ยนแปลง กรุณาตรวจสอบกับสถานีต้นทางอีกครั้ง",
            "ขบวนรถที่มีสัญลักษณ์ <i class='fas fa-star text-warning'></i> คือขบวนรถนำเที่ยว (วิ่งเฉพาะวันหยุด)",
            "สัญลักษณ์ <span class='time-pass'>|</span> หมายถึง รถผ่านแต่ไม่จอดรับส่ง , ช่องว่าง หมายถึง รถไม่ผ่านเส้นทางนี้",
            "เวลาที่แสดงเป็นเวลา <strong> 'ออก'  </strong> <u>ยกเว้น</u>สถานีปลายทางเป็นเวลา 'ถึง' , ที่หยุดรถ/ป้ายหยุดรถ ซื้อตั๋วโดยสารบนขบวนรถ ",
            "คลิกที่ <strong>เลขขบวน</strong> เพื่อติดตามตำแหน่งรถ /คลิกที่ <strong>ชื่อสถานี</strong> เพื่อดูขบวนรถเข้าสถานี ผ่านระบบ TTS View",
			"คลิกที่ <strong>เวลาออก</strong> เพื่อตรวจสอบราคาค่าโดยสารผ่านระบบ SRT Timetable"
        ],
        notFound: "ไม่พบข้อมูล",
        stationHeader: "สถานี"
    },
    en: {
        title: "Timetable",
        loading: "Loading data...",
        lines: {
            1: "Northern Line", 2: "Northeastern Line", 3: "Eastern Line",
            4: "Southern Line", 5: "Wongwian Yai - Mahachai", 6: "Ban Laem - Maeklong"
        },
        trips: { 1: "Outbound", 2: "Inbound" },
        remark_title: "Remarks",
        remarks: [
            "Schedules are subject to change. Please check with the station.",
            "Trains with <i class='fas fa-star text-warning'></i> are Tourist Trains (Run on holidays only).",
            "Symbol <span class='time-pass'>|</span> means Train passes without stopping.",
            "Blank space means Train does not run on this section.",
            "Click <strong>Train No.</strong> for live tracking, or <strong>Station Name</strong> for arriving trains via TTS View.",
			"Click on the <strong>Time</strong> to check fares via the SRT Timetable System."
        ],
        notFound: "No Data Found",
        stationHeader: "Station"
    }
};

// 2. คำแปลชื่อสถานีและขบวนรถ (Translation Map)
const wordMap = {
    'สายเชียงใหม่': 'Chiang Mai', 'สายอุบลฯ': 'Ubon Ratchathani', 'สายหนองคาย': 'Nong Khai',
    'สายอยุธยา': 'Ayutthaya','สายเด่นชัย': 'Den Chai', 'สายพิษณุโลก': 'Phitsanulok', 'สายนครสวรรค์': 'Nakhon Sawan',
    'สายบ้านตาคลี': 'Ban Takhli', 'สายตะพานหิน': 'Taphan Hin', 'สายลพบุรี': 'Lop Buri',
    'สายชุมทางบ้านภาชี': 'Ban Phachi Jct.', 'สายศิลาอาสน์': 'Sila At', 'สายสุรินทร์': 'Surin',
    'สายอุดรธานี': 'Udon Thani', 'สายลำนารายณ์': 'Lam Narai', 'สายสำโรงทาบ': 'Samrong Thap',
    'สายบัวใหญ่': 'Bua Yai', 'สายขอนแก่น': 'Khon Kaen', 'สายแก่งคอย': 'Kaeng Khoi',
    'สายหาดใหญ่': 'Hat Yai', 'สายสุไหงโก-ลก': 'Su-ngai Kolok', 'สายสุราษฎร์ฯ': 'Surat Thani',
    'สายยะลา': 'Yala', 'สายปาดังเบซาร์': 'Padang Besar', 'สายตรัง': 'Trang',
    'สายนครฯ': 'Nakhon Si Thammarat', 'สายกันตัง': 'Kantang', 'สายประจวบฯ': 'Prachuap Khiri Khan',
    'สายหลังสวน': 'Lang Suan', 'สายน้ำตก': 'Nam Tok', 'นครปฐม': 'Nakhon Pathom', 'สายหัวหิน': 'Hua Hin',
    'สายราชบุรี': 'Ratchaburi', 'สายสุพรรณบุรี': 'Suphan Buri', 'สายชุมพร': 'Chumphon',
    'สายสวนสนฯ': 'Suan Son Pradipat', 'สายมหาชัย': 'Mahachai', 'สายแม่กลอง': 'Maeklong',
    'สายอรัญประเทศ': 'Aranyaprathet', 'สายกบินทร์บุรี': 'Kabin Buri', 'สายด่านพรมแดน': 'Border',
    'สายพลูตาหลวง': 'Phlu Ta Luang', 'สายฉะเชิงเทรา': 'Chachoengsao', 'สายปราจีนบุรี': 'Prachin Buri',
    'สายหัวตะเข้': 'Hua Takhe', 'เวียงจันทร์': 'Vientiane', 'ชุมทางแก่งคอย': 'Kaeng Khoi Jct.',
    'ดพ.ดีเซลราง': 'Sp. Ex. DRC', 'รถด่วน': 'Express', 'รถเร็ว': 'Rapid',
    'ธรรมดา': 'Ordinary', 'ชานเมือง': 'Suburban', 'ท้องถิ่น': 'Local', 'พิเศษชานเมือง': 'BKK Commuter',
    'นำเที่ยว': 'Tourist', 'ระหว่างประเทศ': 'International', 'ทั่วไป': 'Ordinary',
    'อุตราวิถี': 'Uttrawithi', 'อีสานมรรคา': 'Isan Makkha', 
    'อีสานวัตนา': 'Isan Watthana', 'ทักษิณารัถย์': 'Thaksinarath',
    'ดพ.ทักษิณ': 'Special Express', 'ด่วนพิเศษ': 'Special Express'
	
};

// 3. รายละเอียดขบวนรถ (Train Details)
const trainDetails = {
	// --- สายเหนือ (Northeastern Line) ---
    '7':  { name: 'ดพ.ดีเซลราง', type: 'special', dest: 'สายเชียงใหม่' }, '8':  { name: 'ดพ.ดีเซลราง', type: 'special', dest: 'สายเชียงใหม่' },
    '9':  { name: 'อุตราวิถี', type: 'special', dest: 'สายเชียงใหม่' }, 	'10': { name: 'อุตราวิถี', type: 'special', dest: 'สายเชียงใหม่' },
    '13': { name: 'ด่วนพิเศษ', type: 'special', dest: 'สายเชียงใหม่' },	'14': { name: 'ด่วนพิเศษ', type: 'special', dest: 'สายเชียงใหม่' },
    '51': { name: 'รถด่วน', type: 'express', dest: 'สายเชียงใหม่' }, 	'52': { name: 'รถด่วน', type: 'express', dest: 'สายเชียงใหม่' },
	'102': { name: 'รถเร็ว', type: 'rapid', dest: 'สายเชียงใหม่' },
    '107': { name: 'รถเร็ว', type: 'rapid', dest: 'สายเด่นชัย' },		'108': { name: 'รถเร็ว', type: 'rapid', dest: 'สายเด่นชัย' },
    '109': { name: 'รถเร็ว', type: 'rapid', dest: 'สายเชียงใหม่' },		'110': { name: 'รถเร็ว', type: 'rapid', dest: 'สายเชียงใหม่' },
    '111': { name: 'รถเร็ว', type: 'rapid', dest: 'สายเด่นชัย' },  	'112': { name: 'รถเร็ว', type: 'rapid', dest: 'สายเด่นชัย' },
    '201': { name: 'ธรรมดา', type: 'ordinary', dest: 'สายพิษณุโลก' }, 	'202': { name: 'ธรรมดา', type: 'ordinary', dest: 'สายพิษณุโลก' },
    '207': { name: 'ธรรมดา', type: 'ordinary', dest: 'สายนครสวรรค์' }, 	'208': { name: 'ธรรมดา', type: 'ordinary', dest: 'สายนครสวรรค์' },
    '209': { name: 'ธรรมดา', type: 'ordinary', dest: 'สายบ้านตาคลี' }, 	'210': { name: 'ธรรมดา', type: 'ordinary', dest: 'สายบ้านตาคลี' },
    '211': { name: 'ธรรมดา', type: 'ordinary', dest: 'สายตะพานหิน' }, 	'212': { name: 'ธรรมดา', type: 'ordinary', dest: 'สายตะพานหิน' },
    '301': { name: 'ชานเมือง', type: 'suburban', dest: 'สายลพบุรี' }, 		'302': { name: 'ชานเมือง', type: 'suburban', dest: 'สายลพบุรี' },
    '303': { name: 'ชานเมือง', type: 'suburban', dest: 'สายลพบุรี' }, 		'304': { name: 'ชานเมือง', type: 'suburban', dest: 'สายลพบุรี' },
    '313': { name: 'ชานเมือง', type: 'suburban', dest: 'สายชุมทางบ้านภาชี' }, '314': { name: 'ชานเมือง', type: 'suburban', dest: 'สายชุมทางบ้านภาชี' },
    '317': { name: 'ชานเมือง', type: 'suburban', dest: 'สายลพบุรี' }, 	'318': { name: 'ชานเมือง', type: 'suburban', dest: 'สายลพบุรี' },
	'9001': { name: 'พิเศษชานเมือง', type: 'feeder_dm', dest: 'BNEX' }, 	'9002': { name: 'พิเศษชานเมือง', type: 'feeder_dm', dest: 'BNEX' },
	'9003': { name: 'พิเศษชานเมือง', type: 'feeder_dm', dest: 'BNEX' }, 	//--'9004': { name: 'พิเศษชานเมือง', type: 'feeder_dm', dest: 'BNEX' },--
	'9005': { name: 'พิเศษชานเมือง', type: 'feeder_dm', dest: 'BNEX' }, 	'9006': { name: 'พิเศษชานเมือง', type: 'feeder_dm', dest: 'BNEX' },
	'9007': { name: 'พิเศษชานเมือง', type: 'feeder_dm', dest: 'BNEX' }, 	'9008': { name: 'พิเศษชานเมือง', type: 'feeder_dm', dest: 'BNEX' },
	'9009': { name: 'พิเศษชานเมือง', type: 'feeder_dm', dest: 'BNEX' }, 	'9010': { name: 'พิเศษชานเมือง', type: 'feeder_dm', dest: 'BNEX' },
	'9011': { name: 'พิเศษชานเมือง', type: 'feeder_dm', dest: 'BNEX' }, 	'9012': { name: 'พิเศษชานเมือง', type: 'feeder_dm', dest: 'BNEX' },
	
    '401': { name: 'ท้องถิ่น', type: 'local', dest: 'สายพิษณุโลก' }, 	'402': { name: 'ท้องถิ่น', type: 'local', dest: 'สายพิษณุโลก' },
    '403': { name: 'ท้องถิ่น', type: 'local', dest: 'สายศิลาอาสน์' }, 	'404': { name: 'ท้องถิ่น', type: 'local', dest: 'สายศิลาอาสน์' },
    '405': { name: 'ท้องถิ่น', type: 'local', dest: 'สายศิลาอาสน์' }, 	'406': { name: 'ท้องถิ่น', type: 'local', dest: 'สายศิลาอาสน์' },
    '407': { name: 'ท้องถิ่น', type: 'local', dest: 'สายเชียงใหม่' }, 	'408': { name: 'ท้องถิ่น', type: 'local', dest: 'สายเชียงใหม่' },
    '409': { name: 'ท้องถิ่น', type: 'local', dest: 'สายลพบุรี' }, 		'410': { name: 'ท้องถิ่น', type: 'local', dest: 'สายศิลาอาสน์' },
	
	// --- สายตะวันออกเฉียงเหนือ (Northeastern Line) ---
    '21': { name: 'ดพ.ดีเซลราง', type: 'special', dest: 'สายอุบลฯ' },    	'22': { name: 'ดพ.ดีเซลราง', type: 'special', dest: 'สายอุบลฯ' },
    '23': { name: 'อีสานมรรคา', type: 'special', dest: 'สายอุบลฯ' },    	'24': { name: 'อีสานมรรคา', type: 'special', dest: 'สายอุบลฯ' },
    '25': { name: 'อีสานวัตนา', type: 'special', dest: 'สายหนองคาย' },   	'26': { name: 'อีสานวัตนา', type: 'special', dest: 'สายหนองคาย' },
    '71': { name: 'ดพ.ดีเซลราง', type: 'special', dest: 'สายอุบลฯ' },    	'72': { name: 'ดพ.ดีเซลราง', type: 'special', dest: 'สายอุบลฯ' },
    '75': { name: 'ดพ.ดีเซลราง', type: 'express', dest: 'สายหนองคาย' },   	'76': { name: 'ดพ.ดีเซลราง', type: 'express', dest: 'สายหนองคาย' },
    '77': { name: 'ดพ.ดีเซลราง', type: 'express', dest: 'สายหนองคาย' },   	'78': { name: 'ดพ.ดีเซลราง', type: 'express', dest: 'สายหนองคาย' },
    '133': { name: 'รถเร็ว', type: 'rapid', dest: 'เวียงจันทร์' },    	'134': { name: 'รถเร็ว', type: 'rapid', dest: 'เวียงจันทร์' },
    '135': { name: 'รถเร็ว', type: 'rapid', dest: 'สายอุบลฯ' },    	'136': { name: 'รถเร็ว', type: 'rapid', dest: 'สายอุบลฯ' },
    '139': { name: 'รถเร็ว', type: 'rapid', dest: 'สายอุบลฯ' },    	'140': { name: 'รถเร็ว', type: 'rapid', dest: 'สายอุบลฯ' },
    '141': { name: 'รถเร็ว', type: 'rapid', dest: 'สายอุบลฯ' },    	'142': { name: 'รถเร็ว', type: 'rapid', dest: 'สายอุบลฯ' },
    '145': { name: 'รถเร็ว', type: 'rapid', dest: 'สายอุบลฯ' },    	'146': { name: 'รถเร็ว', type: 'rapid', dest: 'สายอุบลฯ' },
    '147': { name: 'รถเร็ว', type: 'rapid', dest: 'เวียงจันทร์' },	  	'148': { name: 'รถเร็ว', type: 'rapid', dest: 'เวียงจันทร์' },
    '339': { name: 'ชานเมือง', type: 'suburban', dest: 'ชุมทางแก่งคอย' },	'341': { name: 'ชานเมือง', type: 'suburban', dest: 'ชุมทางแก่งคอย' },
    '233': { name: 'ธรรมดา', type: 'ordinary', dest: 'สายสุรินทร์' }, 	'234': { name: 'ธรรมดา', type: 'ordinary', dest: 'สายสุรินทร์' },
    '415': { name: 'ท้องถิ่น', type: 'local', dest: 'สายหนองคาย' }, 	'416': { name: 'ท้องถิ่น', type: 'local', dest: 'สายอุดรธานี' },
    '417': { name: 'ท้องถิ่น', type: 'local', dest: 'สายอุดรธานี' }, 	'418': { name: 'ท้องถิ่น', type: 'local', dest: 'สายหนองคาย' },
    '419': { name: 'ท้องถิ่น', type: 'local', dest: 'สายอุบลฯ' }, 		'420': { name: 'ท้องถิ่น', type: 'local', dest: 'สายอุบลฯ' },
    '421': { name: 'ท้องถิ่น', type: 'local', dest: 'สายอุบลฯ' }, 		'422': { name: 'ท้องถิ่น', type: 'local', dest: 'สายอุบลฯ' },
    '423': { name: 'ท้องถิ่น', type: 'local', dest: 'สายลำนารายณ์' }, 	'424': { name: 'ท้องถิ่น', type: 'local', dest: 'สายสำโรงทาบ' },
    '425': { name: 'ท้องถิ่น', type: 'local', dest: 'สายอุบลฯ' }, 		'426': { name: 'ท้องถิ่น', type: 'local', dest: 'สายอุบลฯ' },
    '427': { name: 'ท้องถิ่น', type: 'local', dest: 'สายอุบลฯ' }, 		'428': { name: 'ท้องถิ่น', type: 'local', dest: 'สายอุบลฯ' },
    '429': { name: 'ท้องถิ่น', type: 'local', dest: 'สายบัวใหญ่' }, 	'430': { name: 'ท้องถิ่น', type: 'local', dest: 'สายบัวใหญ่' },
    '431': { name: 'ท้องถิ่น', type: 'local', dest: 'สายขอนแก่น' }, 	'432': { name: 'ท้องถิ่น', type: 'local', dest: 'สายขอนแก่น' },
    '433': { name: 'ท้องถิ่น', type: 'local', dest: 'สายแก่งคอย' }, 	'434': { name: 'ท้องถิ่น', type: 'local', dest: 'สายแก่งคอย' },
    '437': { name: 'ท้องถิ่น', type: 'local', dest: 'สายแก่งคอย' }, 	'438': { name: 'ท้องถิ่น', type: 'local', dest: 'สายแก่งคอย' },
    '439': { name: 'ท้องถิ่น', type: 'local', dest: 'สายบัวใหญ่' }, 	'440': { name: 'ท้องถิ่น', type: 'local', dest: 'สายบัวใหญ่' },
	
	// --- สายใต้ (Southern Line) ---
    '31': { name: 'ทักษิณารัถย์', type: 'special', dest: 'สายหาดใหญ่' },		'32': { name: 'ทักษิณารัถย์', type: 'special', dest: 'สายหาดใหญ่' },
    '37': { name: 'ดพ.ทักษิณ', type: 'special', dest: 'สายสุไหงโก-ลก' },    '38': { name: 'ดพ.ทักษิณ', type: 'special', dest: 'สายสุไหงโก-ลก' },
    '39': { name: 'ดพ.ดีเซลราง', type: 'special', dest: 'สายสุราษฎร์ฯ' },   	'40': { name: 'ดพ.ดีเซลราง', type: 'special', dest: 'สายสุราษฎร์ฯ' },
    '41': { name: 'ดพ.ดีเซลราง', type: 'special', dest: 'สายยะลา' },		'42': { name: 'ดพ.ดีเซลราง', type: 'special', dest: 'สายยะลา' },
    '43': { name: 'ดพ.ดีเซลราง', type: 'special', dest: 'สายสุราษฎร์ฯ' },    '44': { name: 'ดพ.ดีเซลราง', type: 'special', dest: 'สายสุราษฎร์ฯ' },
    '45': { name: 'ดพ.ดีเซลราง', type: 'special', dest: 'สายปาดังเบซาร์' },   '46': { name: 'ดพ.ดีเซลราง', type: 'special', dest: 'สายปาดังเบซาร์' },
    '83': { name: 'รถด่วน', type: 'express', dest: 'สายตรัง' },			'84': { name: 'รถด่วน', type: 'express', dest: 'สายตรัง' },
    '85': { name: 'รถด่วน', type: 'express', dest: 'สายนครฯ' },		    '86': { name: 'รถด่วน', type: 'express', dest: 'สายนครฯ' },
    '167': { name: 'รถเร็ว', type: 'rapid', dest: 'สายกันตัง' }, 			'168': { name: 'รถเร็ว', type: 'rapid', dest: 'สายกันตัง' },
    '169': { name: 'รถเร็ว', type: 'rapid', dest: 'สายยะลา' }, 			'170': { name: 'รถเร็ว', type: 'rapid', dest: 'สายยะลา' },
    '171': { name: 'รถเร็ว', type: 'rapid', dest: 'สายสุไหงโก-ลก' }, 		'172': { name: 'รถเร็ว', type: 'rapid', dest: 'สายสุไหงโก-ลก' },
	'173': { name: 'รถเร็ว', type: 'rapid', dest: 'สายนครฯ' }, 		'174': { name: 'รถเร็ว', type: 'rapid', dest: 'สายนครฯ' },
    '251': { name: 'ธรรมดา', type: 'ordinary', dest: 'สายประจวบฯ' }, 	'252': { name: 'ธรรมดา', type: 'ordinary', dest: 'สายประจวบฯ' },
    '254': { name: 'ธรรมดา', type: 'ordinary', dest: 'สายหลังสวน' }, 	'255': { name: 'ธรรมดา', type: 'ordinary', dest: 'สายหลังสวน' },
    '257': { name: 'ธรรมดา', type: 'ordinary', dest: 'สายน้ำตก' }, 		'258': { name: 'ธรรมดา', type: 'ordinary', dest: 'สายน้ำตก' },
    '259': { name: 'ธรรมดา', type: 'ordinary', dest: 'สายน้ำตก' }, 		'260': { name: 'ธรรมดา', type: 'ordinary', dest: 'สายน้ำตก' },
    '261': { name: 'ธรรมดา', type: 'ordinary', dest: 'สายหัวหิน' }, 		'262': { name: 'ธรรมดา', type: 'ordinary', dest: 'สายหัวหิน' },
    '351': { name: 'ชานเมือง', type: 'suburban', dest: 'สายราชบุรี' }, 	'352': { name: 'ชานเมือง', type: 'suburban', dest: 'สายราชบุรี' },
    '355': { name: 'ชานเมือง', type: 'suburban', dest: 'สายสุพรรณบุรี' }, 	'356': { name: 'ชานเมือง', type: 'suburban', dest: 'สายสุพรรณบุรี' },
    '445': { name: 'ท้องถิ่น', type: 'local', dest: 'สายหาดใหญ่' }, 	'446': { name: 'ท้องถิ่น', type: 'local', dest: 'สายหาดใหญ่' },
	'447': { name: 'ท้องถิ่น', type: 'local', dest: 'สายสุไหงโก-ลก' }, 	'463': { name: 'ท้องถิ่น', type: 'local', dest: 'สายสุไหงโก-ลก' },
    '451': { name: 'ท้องถิ่น', type: 'local', dest: 'สายสุไหงโก-ลก' }, 	'452': { name: 'ท้องถิ่น', type: 'local', dest: 'สายสุไหงโก-ลก' },
    '453': { name: 'ท้องถิ่น', type: 'local', dest: 'สายสุไหงโก-ลก' }, 	'454': { name: 'ท้องถิ่น', type: 'local', dest: 'สายสุไหงโก-ลก' },
    '455': { name: 'ท้องถิ่น', type: 'local', dest: 'สายยะลา' }, 		'456': { name: 'ท้องถิ่น', type: 'local', dest: 'สายยะลา' },
    '485': { name: 'ท้องถิ่น', type: 'local', dest: 'สายน้ำตก' }, 		'486': { name: 'ท้องถิ่น', type: 'local', dest: 'สายน้ำตก' },
    '489': { name: 'ท้องถิ่น', type: 'local', dest: 'สายสุราษฎร์ฯ' }, 	'490': { name: 'ท้องถิ่น', type: 'local', dest: 'สายสุราษฎร์ฯ' },
    '909': { name: 'นำเที่ยว', type: 'tourist', dest: 'สายน้ำตก' }, 	'910': { name: 'นำเที่ยว', type: 'tourist', dest: 'สายน้ำตก' },
    '911': { name: 'นำเที่ยว', type: 'tourist', dest: 'สายสวนสนฯ' }, 	'912': { name: 'นำเที่ยว', type: 'tourist', dest: 'สายสวนสนฯ' },
	// รถ Feeder ธนบุรี - นครปฐม
    '1123': { name: 'รถ Feeder', type: 'feeder', dest: 'นครปฐม' },    '1124': { name: 'รถ Feeder', type: 'feeder', dest: 'นครปฐม' },
    '1115': { name: 'รถ Feeder', type: 'feeder', dest: 'นครปฐม' },    '1116': { name: 'รถ Feeder', type: 'feeder', dest: 'นครปฐม' },
	'1117': { name: 'รถ Feeder', type: 'feeder', dest: 'นครปฐม' },    '1118': { name: 'รถ Feeder', type: 'feeder', dest: 'นครปฐม' },
	'1129': { name: 'รถ Feeder', type: 'feeder', dest: 'นครปฐม' },    '1132': { name: 'รถ Feeder', type: 'feeder', dest: 'นครปฐม' },
	
	// --- สายวงเวียนใหญ่ แม่กลอง (Wongwian Yai and Maeklong) ---
    '4302': { name: 'ชานเมือง', type: 'local', dest: 'สายมหาชัย' }, 	'4303': { name: 'ชานเมือง', type: 'local', dest: 'สายมหาชัย' },
    '4304': { name: 'ชานเมือง', type: 'local', dest: 'สายมหาชัย' }, 	'4305': { name: 'ชานเมือง', type: 'local', dest: 'สายมหาชัย' },
    '4306': { name: 'ชานเมือง', type: 'local', dest: 'สายมหาชัย' }, 	'4307': { name: 'ชานเมือง', type: 'local', dest: 'สายมหาชัย' },
    '4308': { name: 'ชานเมือง', type: 'local', dest: 'สายมหาชัย' }, 	'4309': { name: 'ชานเมือง', type: 'local', dest: 'สายมหาชัย' },
    '4310': { name: 'ชานเมือง', type: 'local', dest: 'สายมหาชัย' }, 	'4311': { name: 'ชานเมือง', type: 'local', dest: 'สายมหาชัย' },
    '4312': { name: 'ชานเมือง', type: 'local', dest: 'สายมหาชัย' }, 	'4313': { name: 'ชานเมือง', type: 'local', dest: 'สายมหาชัย' },
    '4314': { name: 'ชานเมือง', type: 'local', dest: 'สายมหาชัย' }, 	'4315': { name: 'ชานเมือง', type: 'local', dest: 'สายมหาชัย' },
    '4316': { name: 'ชานเมือง', type: 'local', dest: 'สายมหาชัย' }, 	'4317': { name: 'ชานเมือง', type: 'local', dest: 'สายมหาชัย' },
    '4320': { name: 'ชานเมือง', type: 'local', dest: 'สายมหาชัย' }, 	'4321': { name: 'ชานเมือง', type: 'local', dest: 'สายมหาชัย' },
    '4322': { name: 'ชานเมือง', type: 'local', dest: 'สายมหาชัย' }, 	'4323': { name: 'ชานเมือง', type: 'local', dest: 'สายมหาชัย' },
    '4324': { name: 'ชานเมือง', type: 'local', dest: 'สายมหาชัย' }, 	'4325': { name: 'ชานเมือง', type: 'local', dest: 'สายมหาชัย' },
    '4326': { name: 'ชานเมือง', type: 'local', dest: 'สายมหาชัย' }, 	'4327': { name: 'ชานเมือง', type: 'local', dest: 'สายมหาชัย' },
    '4328': { name: 'ชานเมือง', type: 'local', dest: 'สายมหาชัย' }, 	'4329': { name: 'ชานเมือง', type: 'local', dest: 'สายมหาชัย' },
    '4340': { name: 'ชานเมือง', type: 'local', dest: 'สายมหาชัย' }, 	'4341': { name: 'ชานเมือง', type: 'local', dest: 'สายมหาชัย' },
    '4342': { name: 'ชานเมือง', type: 'local', dest: 'สายมหาชัย' }, 	'4343': { name: 'ชานเมือง', type: 'local', dest: 'สายมหาชัย' },
    '4344': { name: 'ชานเมือง', type: 'local', dest: 'สายมหาชัย' }, 	'4345': { name: 'ชานเมือง', type: 'local', dest: 'สายมหาชัย' },
    '4346': { name: 'ชานเมือง', type: 'local', dest: 'สายมหาชัย' }, 	'4347': { name: 'ชานเมือง', type: 'local', dest: 'สายมหาชัย' },
    '4380': { name: 'ท้องถิ่น', type: 'local', dest: 'สายแม่กลอง' }, 	'4381': { name: 'ท้องถิ่น', type: 'local', dest: 'สายแม่กลอง' },
    '4382': { name: 'ท้องถิ่น', type: 'local', dest: 'สายแม่กลอง' }, 	'4383': { name: 'ท้องถิ่น', type: 'local', dest: 'สายแม่กลอง' },
    '4384': { name: 'ท้องถิ่น', type: 'local', dest: 'สายแม่กลอง' }, 	'4385': { name: 'ท้องถิ่น', type: 'local', dest: 'สายแม่กลอง' },
    '4386': { name: 'ท้องถิ่น', type: 'local', dest: 'สายแม่กลอง' }, 	'4387': { name: 'ท้องถิ่น', type: 'local', dest: 'สายแม่กลอง' },

    // --- สายตะวันออก (Eastern) ---
    '275': { name: 'ธรรมดา', type: 'ordinary', dest: 'สายอรัญประเทศ' }, '276': { name: 'ธรรมดา', type: 'ordinary', dest: 'สายอรัญประเทศ' },
    '277': { name: 'ธรรมดา', type: 'ordinary', dest: 'สายกบินทร์บุรี' }, '278': { name: 'ธรรมดา', type: 'ordinary', dest: 'สายกบินทร์บุรี' },
    '279': { name: 'ธรรมดา', type: 'ordinary', dest: 'สายด่านพรมแดน' }, '280': { name: 'ธรรมดา', type: 'ordinary', dest: 'สายด่านพรมแดน' },
    '281': { name: 'ธรรมดา', type: 'ordinary', dest: 'สายกบินทร์บุรี' }, '282': { name: 'ธรรมดา', type: 'ordinary', dest: 'สายกบินทร์บุรี' },
    '283': { name: 'ธรรมดา', type: 'ordinary', dest: 'สายพลูตาหลวง' }, '284': { name: 'ธรรมดา', type: 'ordinary', dest: 'สายพลูตาหลวง' },
    '367': { name: 'ธรรมดา', type: 'ordinary', dest: 'สายฉะเชิงเทรา' }, '368': { name: 'ธรรมดา', type: 'ordinary', dest: 'สายฉะเชิงเทรา' },
    '371': { name: 'ธรรมดา', type: 'ordinary', dest: 'สายปราจีนบุรี' }, '372': { name: 'ธรรมดา', type: 'ordinary', dest: 'สายปราจีนบุรี' },
    '379': { name: 'ธรรมดา', type: 'ordinary', dest: 'สายหัวตะเข้' }, '380': { name: 'ธรรมดา', type: 'ordinary', dest: 'สายหัวตะเข้' },
    '383': { name: 'ธรรมดา', type: 'ordinary', dest: 'สายฉะเชิงเทรา' }, '384': { name: 'ธรรมดา', type: 'ordinary', dest: 'สายฉะเชิงเทรา' },
    '389': { name: 'ชานเมือง', type: 'suburban', dest: 'สายฉะเชิงเทรา' }, '390': { name: 'ชานเมือง', type: 'suburban', dest: 'สายฉะเชิงเทรา' },
    '391': { name: 'ชานเมือง', type: 'suburban', dest: 'สายฉะเชิงเทรา' },
    '997': { name: 'รถด่วน', type: 'express', dest: 'สายพลูตาหลวง' }, '998': { name: 'รถด่วน', type: 'express', dest: 'สายพลูตาหลวง' }
};

// 4. ประเภทรถ (Styling Class)
const trainTypes = {
    'special': { label: 'ด่วนพิเศษ', class: 'bg-special' },
    'express': { label: 'รถด่วน', class: 'bg-express' },
    'rapid':   { label: 'รถเร็ว', class: 'bg-rapid' },
    'ordinary':{ label: 'ธรรมดา', class: 'bg-ordinary' },
    'local':   { label: 'ท้องถิ่น', class: 'bg-local' },
    'tourist': { label: 'นำเที่ยว', class: 'bg-tourist' },
    'suburban':{ label: 'ชานเมือง', class: 'bg-suburban' },
    'default': { label: 'ทั่วไป', class: 'bg-ordinary' },
	
	// [เพิ่มบรรทัดนี้ครับ]
    'feeder':  { label: 'Feeder', class: 'bg-feeder' },
	
	// [เพิ่มบรรทัดนี้] แยกสายเหนือออกมาต่างหาก
    'feeder_dm': { label: 'Feeder(KIHA)' , class: 'bg-feeder-dm'}
};