const LENGTH = 400

const CANVAS = document.getElementById('randogram')
const CTX = CANVAS.getContext('2d')

// const OFFICERRANK = document.getElementById('officerRank')
// const RANKPIPS = document.getElementById('rankPips')
// const NEXTRANK = document.getElementById('nextRank')
// const REMAININGRANKBITS = document.getElementById('remainingRankBits')
const ENTROPYRESULT1 = document.getElementById('entropyResult1')
const ENTROPYRESULT2 = document.getElementById('entropyResult2')

let ENTROPY = []
let BITS = []
let NEUMANN = []

function awardOfficerRank (bits) {
  // Thank you https://feathericons.com/
  const openPip = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#333333" stroke="#d1a52c" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="feather feather-circle">
      <circle cx="12" cy="12" r="10"></circle>
    </svg>
  `
  const closedPip = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#d1a52c" stroke="#d1a52c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-circle">
      <circle cx="12" cy="12" r="10"></circle>
    </svg>
  `

  /*
    For each key (rank), the value is the pip assignment as an array of 2 elements.:
      [0, .] are non-boxed pips (Ensign through Fleet Captain)
      [1, .] are boxed pips (Commodore through Fleet Admiral)

    The pips themselves have two values:
      "O" is an open pip (as seen on Chief Petty Officer, Lieutenant Junior Grade, & Lieutenant Commander)
      "C" is a closed pip (as seen on Ensign through Fleet Admiral)

    There is probably a better way to do this.
  */
  const rankPips = {
    'Cadet': '[0, ""]',
    'Chief Petty Officer': '[0, "O"]',
    'Ensign': '[0, "C"]',
    'Lieutenant Junior Grade': '[0, "OC"]',
    'Lieutenant': '[0, "CC"]',
    'Lieutenant Commander': '[0, "OCC"]',
    'Commander': '[0, "CCC"]',
    'Captain': '[0, "CCCC"]',
    'Fleet Captain': '[0, "CCCCC"]',
    'Commodore': '[1, "C"]',
    'Rear Admiral': '[1, "CC"]',
    'Vice Admiral': '[1, "CCC"]',
    'Admiral': '[1, "CCCC"]',
    'Fleet Admiral': '[1, "CCCCC"]'
  }

  /*
    Rank is awarded exponentially based on the number of bits generated as 2**bits >> 4.

    For example:
      - Until you generate less than 64 bits, you are a cadet in the academy.
      - When you have generated 1,280 bits, your awarded rank would be "Commander".
      - When you have generated 128 samples, you would be promoted to "Captain".
      - To reach 'Fleet Admiral', you need to generate 16,384 samples (262,144 bits).

    Rank is only awarded, never revoked.
  */
  const rankOrder = [
    'Cadet',                   //       0 <= bits <      64
    'Chief Petty Officer',     //      64 <= bits <     128
    'Ensign',                  //     128 <= bits <     256
    'Lieutenant Junior Grade', //     256 <= bits <     512
    'Lieutenant',              //     512 <= bits <   1,024
    'Lieutenant Commander',    //   1,024 <= bits <   2,048
    'Commander',               //   2,048 <= bits <   4,096
    'Captain',                 //   4,096 <= bits <   8,192
    'Fleet Captain',           //   8,192 <= bits <  16,384
    'Commodore',               //  16,384 <= bits <  32,768
    'Rear Admiral',            //  32,768 <= bits <  65,536
    'Vice Admiral',            //  65,536 <= bits < 131,072
    'Admiral',                 // 131,072 <= bits < 262,144
    'Fleet Admiral'            // 262,144 <= bits
  ]

  localStorage.lifetimeBits = bits

  let rank

  if (bits < 64) {
    rank = rankOrder[0]
  } else {
    rank = rankOrder[Math.floor(Math.log2(bits >> 4)) - 1]
  }

  let nextRank = rankOrder[rankOrder.indexOf(rank) + 1]

  localStorage.rank = rank
  OFFICERRANK.innerText = rank
  NEXTRANK.innerText = nextRank
  REMAININGRANKBITS.innerText = (2 ** (rankOrder.indexOf(nextRank) + 1) << 4) - localStorage.lifetimeBits

  // openPip, closedPip
  let pipString = ''
  let pips = JSON.parse(rankPips[rank])

  pipString = pips[1].replace(/O/, openPip)
  pipString = pipString.replace(/C/g, closedPip)

  RANKPIPS.innerHTML = pipString

  if (pips[0] === 1) {
    RANKPIPS.style.background = '#333333'
    RANKPIPS.style.border = '3px solid #d1a52c'
    RANKPIPS.style.borderRadius = '5px'
    RANKPIPS.style.padding = '11px 2px 2px 2px'
  }
}

// https://exploringjs.com/impatient-js/ch_typed-arrays.html#concatenating-typed-arrays
function concatenate (resultConstructor, ...arrays) {
  let totalLength = 0

  for (const arr of arrays) {
    totalLength += arr.length
  }

  const result = new resultConstructor(totalLength)
  let offset = 0

  for (const arr of arrays) {
    result.set(arr, offset)
    offset += arr.length
  }

  return result
}

function randogram () {
  return crypto.getRandomValues(new Uint8Array(40000))
}

function genPixels () {
  return concatenate(Uint8Array, randogram(), randogram(), randogram(), randogram())
}

function drawRandogram () {
  if (!window.RANDOGRAM_FLAG) {
    return;
  }

  //let lifetimeBits = parseInt(localStorage.lifetimeBits, 10) || 0
  const imgData = CTX.createImageData(LENGTH, LENGTH)
  const pixels = genPixels()

  if (localStorage.hasOwnProperty('entropy')) {
    ENTROPY = JSON.parse(localStorage.entropy)
  }

  for (let i = 0; i < imgData.data.length; i += 4) {
    if (pixels[i >> 2] < 128) {
      imgData.data[i]     = 255 // red
      imgData.data[i + 1] = 255 // green
      imgData.data[i + 2] = 255 // blue
    }

    imgData.data[i + 3] = 255   // alpha
  }

  updateEntropyCounts() // set count initially
  //awardOfficerRank(lifetimeBits)

  CTX.putImageData(imgData, 0, 0)
  requestAnimationFrame(drawRandogram)

  //document.getElementById('randogram').onpointermove = function (e) {
  CANVAS.onpointermove = function (e) {
    const x = Math.floor(e.offsetX)
    const y = Math.floor(e.offsetY)

    if (0 <= x && x < LENGTH && 0 <= y && y < LENGTH) {
      const index = LENGTH * y + x

      NEUMANN.push(pixels[index] & 1)

      // john von neumann randomness extractor
      if (NEUMANN.length === 2) {
        if (NEUMANN[0] !== NEUMANN[1]) {
          BITS.push(NEUMANN[0])
          //lifetimeBits++

          if (BITS.length === 16) {
            ENTROPY.push(parseInt(BITS.join(''), 2))
            BITS = []
          }
        }

        NEUMANN = []
      }
    } // if 0 <= x < LENGTH && 0 <= y < LENGTH

    localStorage.entropy = JSON.stringify(ENTROPY)

    updateEntropyCounts() // update counts on mouse movement
    //awardOfficerRank(lifetimeBits)
  } // onpointermove
}

function updateEntropyCounts () {
  let items = 0

  if (localStorage.hasOwnProperty('entropy')) {
    items = JSON.parse(localStorage.entropy).length
  }

  ENTROPYRESULT1.innerText = items << 4
  ENTROPYRESULT2.innerText = items
}

function startCanvas() {
  window.RANDOGRAM_FLAG = true
  drawRandogram()
}

function stopCanvas() {
  window.RANDOGRAM_FLAG = false
  CANVAS.onpointermove = undefined
  CTX.clearRect(0, 0, CANVAS.width, CANVAS.height);
}
