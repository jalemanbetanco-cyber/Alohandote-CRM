import { sendLodgingIcal } from './_icalCore.js'

export default async function handler(req, res) {
  return sendLodgingIcal(req, res, req.query.accommodationId)
}
