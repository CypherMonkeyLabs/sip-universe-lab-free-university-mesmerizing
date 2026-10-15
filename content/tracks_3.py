from lib import *

ADV = "Advanced"
CID_A = "a84b4c76e66710@example.com"
CID_B = "b2bua-legb-01@example.com"
TAG_A = "9fxced76sl"
TAG_B = "cubeout01"
TAG_C = "carrier77"
TAG_U = "unitytag1"
BR_A = "z9hG4bK7766as01"
BR_B = "z9hG4bK7766as02"
BR_O = "z9hG4bKoptkeep01"
BR_T = "z9hG4bKoptteams1"

CUBE_RULE = "request INVITE sip-header Diversion remove"
ACME_RULE = """header-rule
name strip-server
header-name Server
action delete
comparison-type boolean
msg-type any
"""


def sec(heading, first, second, *keys):
    return {"h": heading, "paragraphs": [first, second], "cites": cites(*keys)}


def repair(message):
    """Restore a trailing newline sip() strips, and set Content-Length to the CRLF body size."""
    text = message.replace("\r\n", "\n")
    if "\n\n" not in text:
        return text if text.endswith("\n") else text + "\n"
    head, body = text.split("\n\n", 1)
    body = body.rstrip("\n")
    length = len(body.replace("\n", "\r\n").encode()) if body else 0
    lines = []
    for line in head.split("\n"):
        if line.lower().startswith("content-length:"):
            lines.append(f"Content-Length: {length}")
        else:
            lines.append(line)
    return "\n".join(lines) + "\n\n" + body


def sdp_for(ip, session="lab", port=49170, proto="RTP/AVP", pts="0 101"):
    lines = [
        "v=0",
        f"o={session} 2890844526 2890844526 IN IP4 {ip}",
        "s=-",
        f"c=IN IP4 {ip}",
        "t=0 0",
        f"m=audio {port} {proto} {pts}",
        "a=rtpmap:0 PCMU/8000",
    ]
    if "8" in pts.split():
        lines.append("a=rtpmap:8 PCMA/8000")
    if "101" in pts.split():
        lines.append("a=rtpmap:101 telephone-event/8000")
        lines.append("a=fmtp:101 0-16")
    lines.append("a=sendrecv")
    return "\n".join(lines) + "\n"


def msg_invite(src, dst_host, call_id, branch, from_tag, body=None, extra=None, number="+15551212", transport="UDP", contact_user="alice", contact_host=None, from_uri="sip:alice@example.com", from_name="Alice", cseq=1):
    contact_host = src if contact_host is None else contact_host
    headers = [
        f"Via: SIP/2.0/{transport} {src};branch={branch}",
        "Max-Forwards: 70",
        f"From: \"{from_name}\" <{from_uri}>;tag={from_tag}",
        f"To: <sip:{number}@example.com>",
        f"Call-ID: {call_id}",
        f"CSeq: {cseq} INVITE",
        f"Contact: <sip:{contact_user}@{contact_host}>",
        "Supported: 100rel,replaces,timer",
        "Allow: INVITE,ACK,CANCEL,BYE,UPDATE,PRACK,OPTIONS,REFER",
    ]
    if extra:
        headers.extend(extra)
    payload = sdp_for(src) if body is None else body
    if payload:
        headers.append("Content-Type: application/sdp")
    return repair(sip(f"INVITE sip:{number}@{dst_host} SIP/2.0", headers, payload))


def msg_resp(code, reason, via_host, branch, from_tag, to_tag, call_id, cseq, extra=None, body="", transport="UDP", number="+15551212", from_uri="sip:alice@example.com", from_name="Alice"):
    to_line = f"To: <sip:{number}@example.com>"
    if to_tag:
        to_line += f";tag={to_tag}"
    headers = [
        f"Via: SIP/2.0/{transport} {via_host};branch={branch}",
        f"From: \"{from_name}\" <{from_uri}>;tag={from_tag}",
        to_line,
        f"Call-ID: {call_id}",
        f"CSeq: {cseq}",
    ]
    if body:
        headers.append("Content-Type: application/sdp")
    if extra:
        headers.extend(extra)
    return repair(sip(f"SIP/2.0 {code} {reason}", headers, body))


def msg_ack(src, dst_host, branch, from_tag, to_tag, call_id, body="", transport="UDP", contact_host=None):
    contact_host = src if contact_host is None else contact_host
    headers = [
        f"Via: SIP/2.0/{transport} {src};branch={branch}",
        "Max-Forwards: 70",
        f"From: \"Alice\" <sip:alice@example.com>;tag={from_tag}",
        f"To: <sip:+15551212@example.com>;tag={to_tag}",
        f"Call-ID: {call_id}",
        "CSeq: 1 ACK",
        f"Contact: <sip:alice@{contact_host}>",
    ]
    if body:
        headers.append("Content-Type: application/sdp")
    return repair(sip(f"ACK sip:+15551212@{dst_host} SIP/2.0", headers, body))


def msg_options(src, dst, branch, call_id, from_tag, transport="UDP", contact_host=None, port=None, cseq=1):
    contact_host = src if contact_host is None else contact_host
    target = dst if port is None else f"{dst}:{port}"
    return repair(sip(
        f"OPTIONS sip:{target} SIP/2.0",
        [
            f"Via: SIP/2.0/{transport} {src};branch={branch}",
            "Max-Forwards: 70",
            f"From: <sip:sbc@{contact_host}>;tag={from_tag}",
            f"To: <sip:{dst}>",
            f"Call-ID: {call_id}",
            f"CSeq: {cseq} OPTIONS",
            f"Contact: <sip:sbc@{contact_host}>",
            "Accept: application/sdp",
        ],
    ))


def msg_options_ok(via_host, branch, from_tag, dst, call_id, transport="UDP", contact_host=None, contact=None, from_host=None):
    contact_host = dst if contact_host is None else contact_host
    from_host = via_host if from_host is None else from_host
    contact_hdr = f"<sip:{contact_host}>" if contact is None else contact
    return repair(sip(
        "SIP/2.0 200 OK",
        [
            f"Via: SIP/2.0/{transport} {via_host};branch={branch}",
            f"From: <sip:sbc@{from_host}>;tag={from_tag}",
            f"To: <sip:{dst}>;tag=optok1",
            f"Call-ID: {call_id}",
            "CSeq: 1 OPTIONS",
            "Allow: INVITE,ACK,CANCEL,BYE,OPTIONS,UPDATE",
            "Accept: application/sdp",
            f"Contact: {contact_hdr}",
        ],
    ))


def ccsip(direction, message, stamp):
    rows = [
        f"{stamp}: //-1/000000000000/SIP/Msg/ccsipDisplayMsg:",
        f"{stamp}: {direction}:",
    ]
    for line in message.splitlines():
        rows.append(f"{stamp}: {line}")
    return "\n".join(rows) + "\n"


def eight(title, notes):
    if len(notes) != 8:
        raise ValueError(title)
    built = basic_flow(title, notes)
    for step in built["steps"]:
        step["message"] = repair(step["message"])
    return built


_lib_flow = flow


def flow(title, parties, steps):
    built = _lib_flow(title, parties, steps)
    for step in built["steps"]:
        step["message"] = repair(step["message"])
    return built


PHONE_SDP = sdp_for(ALICE, "alice", 49170, pts="0 8 101")
ANCHOR_SDP = sdp_for(CUBE, "cube", 19642)
CARRIER_SDP = sdp_for(CARRIER, "carrier", 24000)
SRTP_SDP = sdp_for(CUBE, "sbc", 19642, proto="RTP/SAVP", pts="0")


def track_sbc():
    L = ADV
    hide_in = msg_invite(ALICE, CUBE, CID_A, BR_A, TAG_A, extra=["User-Agent: LabPhone/1.0", "Record-Route: <sip:203.0.113.10;lr>"])
    hide_out = msg_invite(CUBE, CARRIER, CID_B, BR_B, TAG_B, body=ANCHOR_SDP, contact_user="sbc")
    opt = msg_options(CUBE, CARRIER, BR_O, "opt-keep-1@example.com", "opt1")
    opt_ok = msg_options_ok(CUBE, BR_O, "opt1", CARRIER, "opt-keep-1@example.com")
    admit = msg_invite(ALICE, CUBE, CID_A, BR_A, TAG_A)
    return {
        "id": "sbc",
        "title": "Session border controllers",
        "summary": "Deployment requirements, the B2BUA role, and the functions whose limits stay on the vendor datasheet.",
        "level": L,
        "order": 9,
        "lessons": [
            lesson(L, id="requirements-5853", title="RFC 5853 is requirements, not a protocol", minutes=14, tags=["sbc", "rfc5853"],
                summary="RFC 5853 collects requirements from SBC deployments. It does not define an SBC wire protocol.",
                objectives=["Classify RFC 5853 as informational", "Name functions operators ask an SBC to perform", "Keep those functions separate from SIP methods"],
                illustration={"type": "layers", "title": "Requirements sit above SIP", "caption": "RFC 5853 describes deployments. SIP, SDP, and RTP keep their own specifications.",
                    "layers": [{"name": "RFC 5853", "detail": "Informational requirements from deployments"}, {"name": "SIP", "detail": "INVITE, responses, dialogs, OPTIONS"}, {"name": "SDP and RTP", "detail": "Offer, answer, and the media packets"}]},
                sections=[
                    sec("No SBC protocol RFC",
                        "There is no single protocol RFC that defines an SBC. RFC 5853 is informational requirements gathered from SBC deployments.",
                        "The document does not add a SIP method, a response code, or a header that every SBC must speak. INVITE, OPTIONS, and 200 OK remain the RFC 3261 messages you already read.",
                        "5853", "3261"),
                    sec("Functions the deployments asked for",
                        "Topology hiding, media anchoring, media bypass, transcoding, DTMF interworking, OPTIONS keepalives, and call admission show up as deployment functions. Each one is implemented by a product, on top of SIP and RTP.",
                        "Session limits and calls-per-second figures are platform-specific and must come from the vendor datasheet. This track does not invent a counter name or a formula for them.",
                        "5853", "7092"),
                ],
                flow=eight("Requirements do not change the ladder", [
                    "Alice still sends an ordinary INVITE. RFC 5853 does not replace that request.",
                    "100 Trying is still hop-by-hop on this leg.",
                    "The SBC, acting as a B2BUA, creates the outbound INVITE.",
                    "180 Ringing is still a provisional response.",
                    "The caller leg learns that the far side is alerting.",
                    "200 OK still carries the answer SDP on the far leg.",
                    "The caller receives 200 OK only after the SBC forwards it.",
                    "ACK completes the caller dialog. No SBC-specific method appears.",
                ]),
                quiz=[
                    quiz_item("RFC 5853 is", ["An informational requirements document", "The protocol specification of an SBC", "A replacement for RFC 3261", "A codec recommendation"], 0, "It records what deployments asked SBCs to do. It does not define a new wire protocol.", "5853"),
                    quiz_item("Which statement matches the status of an SBC specification?", ["No single protocol RFC defines an SBC", "RFC 3261 section 4 is the SBC protocol", "RFC 7092 is a media codec list", "ITU-T G.711 is the SBC signaling RFC"], 0, "RFC 7092 taxonomizes B2BUAs. G.711 is a codec recommendation.", "5853"),
                    quiz_item("Call-capacity numbers for an SBC belong in", ["The vendor datasheet for that platform", "RFC 5853 as a universal CPS formula", "The SDP m= line", "The Via branch cookie"], 0, "Limits are platform-specific. Do not invent a calls-per-second formula.", "5853"),
                    quiz_item("Topology hiding is best classified as", ["A deployment function", "A new SIP method", "A DNS NAPTR flag", "An RTP payload type"], 0, "RFC 5853 treats it as a requirement seen in deployments.", "5853"),
                    quiz_item("An OPTIONS keepalive uses", ["The OPTIONS method from RFC 3261", "A method named KEEPALIVE", "REGISTER with Expires 0 only", "A 180 response with no request"], 0, "OPTIONS is the standard capability request. The interval is product configuration.", "3261-11"),
                    quiz_item("Media transcoding capacity should be taken from", ["The platform datasheet", "A formula in RFC 3264", "The Max-Forwards value", "The length of Call-ID"], 0, "RFC 3264 defines offer/answer, not a session budget.", "3264"),
                ],
                cards=[
                    card("RFC 5853", "Informational requirements from SBC deployments. Not an SBC protocol.", "5853"),
                    card("No SBC method", "INVITE and OPTIONS stay as RFC 3261 defined them.", "3261"),
                    card("Datasheet", "Session and transcode limits are platform-specific.", "5853"),
                    card("B2BUA", "The usual SIP role behind an SBC. Taxonomy is RFC 7092.", "7092"),
                ],
                lab={"title": "Find the protocol", "kind": "ladder", "prompt": "Play the ladder. Which start line is an SBC-specific method?",
                    "steps": ["Play the eight hops.", "Read each request start line.", "List the methods you actually see."],
                    "check": check("Which methods appear in this synthetic call?", ["INVITE and ACK", "SBCSETUP and INVITE", "REGISTER only", "SUBSCRIBE only"], 0, "The ladder is ordinary SIP. RFC 5853 did not add a method.", "3261")},
                fault={"title": "Searching for method SBC", "symptom": "A trace review rejects a healthy call because no SBC method is present.",
                    "log": "INVITE sip:+15551212@203.0.113.20 SIP/2.0\nVia: SIP/2.0/UDP 203.0.113.10;branch=z9hG4bK7766as01\nCSeq: 1 INVITE\nCall-ID: a84b4c76e66710@example.com\n",
                    "choices": ["The call is ordinary SIP and RFC 5853 adds no method", "RFC 5853 requires method SBCSETUP", "The branch cookie is an SBC protocol identifier", "Max-Forwards must be 5853"],
                    "answer": 0, "why": "The start line is a normal INVITE.", "cause": "The reviewer treated an informational requirements RFC as a wire protocol.", "fix": "Read RFC 5853 as deployment requirements. Judge the call with RFC 3261, RFC 3264, and the product guide.", "cites": cites("5853", "3261")},
            ),
            lesson(L, id="b2bua-7092", title="An SBC is commonly a B2BUA", minutes=14, tags=["b2bua", "rfc7092"],
                summary="RFC 7092 taxonomizes B2BUAs. An SBC is commonly a UAS on one side and a UAC on the other, not a pure proxy.",
                objectives=["Contrast a B2BUA with a pure proxy", "Point at two dialogs in one call", "Use RFC 7092 as the taxonomy"],
                illustration={"type": "states", "title": "Two dialogs, one call", "caption": "The inbound side is a UAS dialog. The outbound side is a new UAC dialog.",
                    "nodes": ["INVITE in", "UAS dialog", "New INVITE", "UAC dialog"]},
                sections=[
                    sec("UAS on one side, UAC on the other",
                        "A back-to-back user agent receives a request and processes it as a UAS. To continue the call it acts as a UAC and generates a new request.",
                        "RFC 3261 defines that concatenation. RFC 7092 taxonomizes the B2BUAs that products actually build, including SBCs that also touch media.",
                        "7092", "3261"),
                    sec("Not a pure proxy",
                        "A pure proxy forwards the same request and adds its own Via. It does not create a second dialog with a new Call-ID just to hide the first hop.",
                        "An SBC is commonly a B2BUA. The outbound INVITE in this synthetic uses Call-ID b2bua-legb-01@example.com while the caller still uses Call-ID a84b4c76e66710@example.com.",
                        "7092", "3261-16"),
                ],
                flow=flow("Two Call-IDs for one conversation", ["Alice", "SBC", "Carrier"], [
                    hop(0, 1, "INVITE", "req", "Alice’s INVITE is the inbound dialog. Call-ID a84b4c76e66710@example.com.", hide_in),
                    hop(1, 0, "100", "res", "The SBC answers as a UAS on that dialog.", msg_resp(100, "Trying", ALICE, BR_A, TAG_A, "", CID_A, "1 INVITE")),
                    hop(1, 2, "INVITE", "req", "The SBC sends a new INVITE as a UAC. The Call-ID is new.", hide_out),
                    hop(2, 1, "200", "res", "The carrier answers the outbound dialog.", msg_resp(200, "OK", CUBE, BR_B, TAG_B, TAG_C, CID_B, "1 INVITE", extra=[f"Contact: <sip:bob@{CARRIER}>"], body=CARRIER_SDP)),
                    hop(1, 0, "200", "res", "The SBC answers Alice on the original dialog.", msg_resp(200, "OK", ALICE, BR_A, TAG_A, "314159", CID_A, "1 INVITE", extra=[f"Contact: <sip:sbc@{CUBE}>"], body=ANCHOR_SDP)),
                ]),
                quiz=[
                    quiz_item("RFC 7092 is", ["A taxonomy of SIP B2BUAs", "The SBC wire protocol", "The RTP profile for G.711", "A DNS locating procedure"], 0, "It classifies B2BUAs. It is not a second SIP.", "7092"),
                    quiz_item("On the caller side an SBC commonly behaves as a", ["UAS", "DNS server", "Redirect server only", "Pure stateless proxy"], 0, "It must produce responses for the dialog it accepted.", "7092"),
                    quiz_item("On the callee side an SBC commonly behaves as a", ["UAC that generates a new request", "Registrar", "DHCP relay", "RTP mixer with no SIP"], 0, "The outbound request is a new client transaction.", "3261"),
                    quiz_item("A pure proxy typically", ["Forwards the request and adds Via", "Mints a new Call-ID and drops the caller Via stack", "Terminates RTP in every call", "Replaces SDP with ISUP"], 0, "Via accumulation is proxy behavior. A B2BUA builds a new request.", "3261-16"),
                    quiz_item("In the synthetic ladder the outbound Call-ID is", ["b2bua-legb-01@example.com", "The same value as Alice’s Call-ID", "Empty", "The branch cookie"], 0, "The new Call-ID is the visible sign of the second dialog.", "7092"),
                    quiz_item("Dialog state on a B2BUA is", ["Maintained on each leg it creates", "Forbidden by RFC 3261", "Stored only in DNS", "Optional for INVITE"], 0, "RFC 3261 says a B2BUA maintains dialog state and participates in requests on those dialogs.", "3261"),
                ],
                cards=[
                    card("B2BUA", "UAS plus UAC. Two dialogs for one call.", "7092"),
                    card("Pure proxy", "Forwards the request and adds Via.", "3261-16"),
                    card("Call-ID", "Often different on the two legs of an SBC.", "7092"),
                    card("RFC 3261", "Defines the B2BUA as UAS concatenated with UAC.", "3261"),
                ],
                lab={"title": "Dissect the outbound INVITE", "kind": "dissect", "prompt": "This is the SBC’s outbound INVITE. Which Call-ID belongs to the carrier leg?",
                    "message": hide_out,
                    "check": check("The Call-ID on this outbound INVITE is", ["b2bua-legb-01@example.com", "a84b4c76e66710@example.com", "Missing", "z9hG4bK7766as01"], 0, "The carrier leg is a new dialog.", "7092")},
                fault={"title": "Expecting proxy Via accumulation", "symptom": "The carrier INVITE contains only the SBC Via. The reviewer marks the hop broken.",
                    "log": hide_out,
                    "choices": ["A B2BUA created a new request, so the caller Via is not forwarded", "RFC 7092 requires every Via from Alice to be copied", "The missing second Via makes the INVITE illegal", "Call-ID must be empty on a B2BUA"],
                    "answer": 0, "why": "The outbound Via is 203.0.113.20 only.", "cause": "The trace was judged with proxy rules. This SBC is a B2BUA.", "fix": "Compare Call-ID, tags, and Via on the two legs. Use RFC 7092 for the role and RFC 3261 for each dialog.", "cites": cites("7092", "3261-16")},
            ),
            lesson(L, id="topology-hiding", title="Topology hiding rewrites the addresses you leak", minutes=13, tags=["topology", "contact", "via"],
                summary="Topology hiding replaces caller addresses in signaling and, when media is anchored, in SDP.",
                objectives=["Name the headers that leak topology", "See Contact and Via change at the B2BUA", "Leave the rewrite policy in the product guide"],
                illustration={"type": "table", "title": "What this synthetic hides", "caption": "Addresses below are the lab’s documentation addresses.",
                    "columns": ["Field", "Caller leg", "Carrier leg"],
                    "rows": [["Via host", "203.0.113.10", "203.0.113.20"], ["Contact host", "203.0.113.10", "203.0.113.20"], ["Call-ID", "a84b4c76e66710@example.com", "b2bua-legb-01@example.com"], ["SDP c=", "203.0.113.10", "203.0.113.20"]]},
                sections=[
                    sec("What a caller reveals",
                        "Alice’s INVITE in this lab carries Via 203.0.113.10, Contact sip:alice@203.0.113.10, and an SDP c= line of 203.0.113.10. A Record-Route or User-Agent can leak still more.",
                        "A pure proxy would add a Via and forward the rest. Topology hiding is the deployment function that stops those internal names from reaching the carrier.",
                        "5853", "3261"),
                    sec("What the carrier is allowed to see",
                        "The outbound INVITE uses Via 203.0.113.20, Contact sip:sbc@203.0.113.20, and SDP c=203.0.113.20. The caller Via, the caller Contact, and the User-Agent are not copied.",
                        "Which extra headers a product strips is a configuration choice documented by that vendor. RFC 5853 records the requirement. It does not publish one vendor’s header list.",
                        "5853", "7092"),
                ],
                flow=flow("Hide the caller address", ["Alice", "SBC", "Carrier"], [
                    hop(0, 1, "INVITE", "req", "Caller addresses are still visible on the inside leg.", hide_in),
                    hop(1, 0, "100", "res", "The SBC accepts the dialog before it builds the outside request.", msg_resp(100, "Trying", ALICE, BR_A, TAG_A, "", CID_A, "1 INVITE")),
                    hop(1, 2, "INVITE", "req", "The carrier sees the SBC addresses only.", hide_out),
                    hop(2, 1, "180", "res", "The carrier Contact stays on the outside leg.", msg_resp(180, "Ringing", CUBE, BR_B, TAG_B, TAG_C, CID_B, "1 INVITE", extra=[f"Contact: <sip:bob@{CARRIER}>"])),
                ]),
                quiz=[
                    quiz_item("Topology hiding is aimed at", ["Internal addresses and names in signaling", "The RTP sequence number only", "The SDP version character v=", "Max-Forwards counting"], 0, "Via, Contact, and SDP c= are the usual leaks.", "5853"),
                    quiz_item("On the carrier INVITE in this lesson, Contact is", ["sip:sbc@203.0.113.20", "sip:alice@203.0.113.10", "Absent", "sip:alice@192.0.2.40"], 0, "The B2BUA replaced the caller Contact.", "7092"),
                    quiz_item("A pure proxy would typically", ["Forward Alice’s Contact and add a Via", "Delete every Via", "Remove Call-ID", "Convert INVITE to REGISTER"], 0, "Forwarding the Contact is why a proxy does not hide the caller.", "3261-16"),
                    quiz_item("When media is anchored, SDP c= on the outside leg names", ["The SBC media address", "The phone’s private socket only", "The DNS resolver", "Port 5060 always"], 0, "Here that address is 203.0.113.20.", "3264"),
                    quiz_item("User-Agent on the carrier INVITE in this synthetic is", ["Not copied from the phone", "Required to be LabPhone/1.0", "Replaced by the Call-ID", "A mandatory RFC 5853 header"], 0, "The outside request omits the phone’s User-Agent.", "5853"),
                    quiz_item("The list of headers a given SBC strips is found in", ["That product’s guide", "RFC 5853 as a fixed mandatory list", "The RTP payload type table", "RFC 3261 section 11 only"], 0, "The RFC states the requirement. The product states the knobs.", "5853"),
                ],
                cards=[
                    card("Via", "Identifies the previous SIP hop. Hide the internal one.", "3261"),
                    card("Contact", "Dialog target. An SBC usually substitutes its own.", "7092"),
                    card("c=", "SDP connection address. Anchoring rewrites it.", "3264"),
                    card("User-Agent", "A common topology leak. Stripping it is a product rule.", "5853"),
                ],
                lab={"title": "Compare Contact hosts", "kind": "dissect", "prompt": "Dissect the carrier INVITE. Which host is in Contact?",
                    "message": hide_out,
                    "check": check("Contact on the carrier INVITE names", ["203.0.113.20", "203.0.113.10", "198.51.100.30", "No host"], 0, "The SBC address replaced the phone address.", "7092")},
                fault={"title": "Caller Contact leaked", "symptom": "The carrier INVITE still targets the dialog at 203.0.113.10, which is not routed on the carrier side.",
                    "log": msg_invite(CUBE, CARRIER, CID_B, BR_B, TAG_B, body=sdp_for(ALICE, "alice"), contact_host=ALICE),
                    "choices": ["Contact and SDP c= still name the phone, so topology was not hidden", "RFC 3261 forbids Contact on INVITE", "The carrier must use the Via branch as the RTP address", "Call-ID length caused the leak"],
                    "answer": 0, "why": "Both Contact and c= still say 203.0.113.10.", "cause": "The outbound request was built like a proxy forward of the caller addresses.", "fix": "On an anchoring B2BUA, put the SBC in Contact and in SDP c= before the request leaves toward the carrier. Confirm the header list in the product guide.", "cites": cites("5853", "3264")},
            ),
            lesson(L, id="media-modes", title="Anchor, bypass, transcode, and DTMF", minutes=15, tags=["media", "dtmf", "sdp"],
                summary="Anchoring terminates RTP on the SBC. Bypass lets endpoints exchange media. Transcoding and DTMF interworking need the media path.",
                objectives=["Separate anchoring from bypass", "Tie transcoding to an anchored path", "Treat DTMF interworking as a media function"],
                illustration={"type": "table", "title": "Four deployment functions", "caption": "Capacity for transcoding is platform-specific.",
                    "columns": ["Function", "Signaling", "Media", "Limit"],
                    "rows": [["Anchor", "B2BUA", "RTP ends on the SBC", "Datasheet"], ["Bypass", "B2BUA", "RTP goes endpoint to endpoint", "Datasheet"], ["Transcode", "B2BUA", "SBC decodes and encodes", "Datasheet"], ["DTMF interwork", "May rewrite INFO or events", "telephone-event or in-band", "Datasheet"]]},
                sections=[
                    sec("Anchoring and bypass",
                        "Media anchoring means the SBC terminates RTP and originates a second RTP stream. In this lab the inside c= is 203.0.113.10 and the outside c= is 203.0.113.20.",
                        "Media bypass leaves a path where the endpoints send RTP to each other. The SBC still handles SIP. The product guide is where bypass conditions are written.",
                        "3264", "3550"),
                    sec("Transcoding and DTMF",
                        "Transcoding converts one codec to another, so the SBC must be on the media path. How many sessions a chassis can transcode is platform-specific and must come from the vendor datasheet.",
                        "DTMF interworking converts between RFC 4733 telephone-event and another form the peer understands, such as in-band tones. There is no universal counter for that work in RFC 5853.",
                        "4733", "5853"),
                ],
                flow=flow("Anchored answer SDP", ["Alice", "SBC", "Carrier"], [
                    hop(0, 1, "INVITE", "req", "Alice offers PCMU and PCMA from 203.0.113.10.", msg_invite(ALICE, CUBE, CID_A, BR_A, TAG_A, body=PHONE_SDP)),
                    hop(1, 2, "INVITE", "req", "The SBC offers its own address and PCMU.", msg_invite(CUBE, CARRIER, CID_B, BR_B, TAG_B, body=ANCHOR_SDP, contact_user="sbc")),
                    hop(2, 1, "200", "res", "The carrier answers from 192.0.2.40.", msg_resp(200, "OK", CUBE, BR_B, TAG_B, TAG_C, CID_B, "1 INVITE", extra=[f"Contact: <sip:bob@{CARRIER}>"], body=CARRIER_SDP)),
                    hop(1, 0, "200", "res", "Alice is answered from the SBC media address.", msg_resp(200, "OK", ALICE, BR_A, TAG_A, "314159", CID_A, "1 INVITE", extra=[f"Contact: <sip:sbc@{CUBE}>"], body=ANCHOR_SDP)),
                ]),
                quiz=[
                    quiz_item("Media anchoring means", ["The SBC terminates RTP and starts a new stream", "SIP is encrypted and RTP is unchanged by definition", "The phone sends RTP to the carrier c= line directly", "REGISTER carries the audio"], 0, "Two RTP legs meet at the SBC.", "3550"),
                    quiz_item("Media bypass means", ["Endpoints can exchange RTP while SIP still visits the SBC", "The SBC must transcode G.711 to G.729", "SDP is omitted", "OPTIONS is disabled"], 0, "Signaling and media take different paths.", "3264"),
                    quiz_item("Transcoding requires", ["The SBC on the media path", "A pure proxy with no RTP", "Only a DNS change", "Max-Forwards set to 1"], 0, "The SBC has to decode one codec and encode another.", "5853"),
                    quiz_item("Where do you read how many transcoded sessions a box supports?", ["The vendor datasheet", "RFC 4733", "The Via branch", "RFC 5853’s mandatory formula"], 0, "The RFC does not publish a platform capacity.", "5853"),
                    quiz_item("RFC 4733 telephone-event is", ["An RTP payload for DTMF digits", "A SIP method", "A TLS version", "A B2BUA taxonomy"], 0, "Named events ride in RTP. Interworking is an SBC function when the peer differs.", "4733"),
                    quiz_item("In the anchored ladder, Alice’s 200 OK uses c=", ["203.0.113.20", "203.0.113.10", "192.0.2.40", "198.51.100.30"], 0, "The answer she receives names the SBC, not the carrier.", "3264"),
                ],
                cards=[
                    card("Anchor", "RTP terminates on the SBC. SDP c= names the SBC.", "3550"),
                    card("Bypass", "SIP through the SBC. Media between endpoints.", "3264"),
                    card("Transcode", "Decode and encode. Capacity is on the datasheet.", "5853"),
                    card("telephone-event", "RFC 4733 DTMF in RTP.", "4733"),
                ],
                lab={"title": "Negotiate an anchored answer", "kind": "sdp", "prompt": "Alice offers PCMU and PCMA. The anchored answer keeps PCMU and telephone-event.",
                    "offer": PHONE_SDP, "answer": ANCHOR_SDP,
                    "check": check("Which audio codec is in both the offer and this answer?", ["PCMU", "PCMA", "G.722", "Opus"], 0, "The answer kept payload 0 and dropped payload 8.", "3264")},
                fault={"title": "Bypass addresses on an anchored design", "symptom": "The carrier is supposed to send RTP to the SBC, but the INVITE still advertises the phone.",
                    "log": "INVITE sip:+15551212@192.0.2.40 SIP/2.0\nContact: <sip:alice@203.0.113.10>\nContent-Type: application/sdp\nc=IN IP4 203.0.113.10\nm=audio 49170 RTP/AVP 0\n",
                    "choices": ["SDP c= and Contact still name the phone, so media will miss the anchor", "PCMU is illegal on an SBC", "c= must be a DNS SRV name", "The m= line disables RTP"],
                    "answer": 0, "why": "c=IN IP4 203.0.113.10 tells the carrier to send RTP to the phone.", "cause": "The outbound SDP was not rewritten for anchoring.", "fix": "If the design anchors media, advertise the SBC address 203.0.113.20 in c= and the SBC port. If the design is bypass, confirm that the phone address is actually reachable from the carrier.", "cites": cites("3264", "3550")},
            ),
            lesson(L, id="options-keepalive", title="OPTIONS keepalives", minutes=12, tags=["options", "keepalive"],
                summary="SBCs probe a peer with OPTIONS. A 200 OK means the peer answered. The interval is product configuration.",
                objectives=["Build a legal OPTIONS", "Read a 200 OK as liveness", "Keep the timer out of the RFC"],
                illustration={"type": "states", "title": "A keepalive, then a call", "caption": "RFC 3261 defines OPTIONS. It does not define the SBC’s repeat timer.",
                    "nodes": ["Send OPTIONS", "Receive 200", "Peer answered", "INVITE may follow"]},
                sections=[
                    sec("The request RFC 3261 already defined",
                        "OPTIONS queries capabilities. Outside a dialog it is a simple request with its own CSeq method token, which must be OPTIONS.",
                        "In this synthetic the SBC at 203.0.113.20 sends OPTIONS to 192.0.2.40. The 200 OK lists Allow and proves the peer produced a response.",
                        "3261-11", "3261-8"),
                    sec("What the 200 does not standardize",
                        "Many SBC deployments send OPTIONS on a timer and treat a missing answer as a down peer. That timer is product configuration.",
                        "RFC 3261 does not publish an SBC keepalive interval, and this lesson does not invent one. Use the guide for the software you run.",
                        "3261-11", "5853"),
                ],
                flow=flow("OPTIONS before the next INVITE", ["SBC", "Carrier"], [
                    hop(0, 1, "OPTIONS", "req", "The keepalive is a normal OPTIONS request.", opt),
                    hop(1, 0, "200", "res", "200 OK means the peer answered the probe.", opt_ok),
                    hop(0, 1, "INVITE", "req", "A later call is a separate transaction.", msg_invite(CUBE, CARRIER, CID_B, BR_B, TAG_B, body=ANCHOR_SDP, contact_user="sbc")),
                    hop(1, 0, "100", "res", "100 Trying belongs to the INVITE, not to the OPTIONS.", msg_resp(100, "Trying", CUBE, BR_B, TAG_B, "", CID_B, "1 INVITE")),
                ]),
                quiz=[
                    quiz_item("A keepalive OPTIONS uses CSeq method", ["OPTIONS", "INVITE", "ACK", "BYE"], 0, "The method token must match the request line.", "3261-8"),
                    quiz_item("200 OK to OPTIONS means", ["The peer answered the probe", "The phone is off hook", "Media bypass is enabled", "The datasheet limit was raised"], 0, "It is evidence of a SIP response, not a codec budget.", "3261-11"),
                    quiz_item("The repeat interval for SBC OPTIONS is", ["Product configuration", "Fixed at 1 second by RFC 3261", "Carried in the branch cookie", "Equal to the SDP ptime"], 0, "Do not copy a timer from a different product.", "5853"),
                    quiz_item("OPTIONS is defined in", ["RFC 3261", "RFC 3550", "RFC 4733", "ITU-T G.711"], 0, "Section 11 describes the method.", "3261-11"),
                    quiz_item("The INVITE after a keepalive is", ["A new transaction", "The same CSeq as the OPTIONS", "Required to omit Via", "A provisional response"], 0, "Different method, different transaction.", "3261"),
                    quiz_item("Allow on the 200 OK", ["Advertises methods the peer claims to support", "Sets the RTP port", "Hides topology", "Replaces Contact"], 0, "It is a capability hint in the response.", "3261-11"),
                ],
                cards=[
                    card("OPTIONS", "Capability and liveness request. RFC 3261.", "3261-11"),
                    card("CSeq method", "Must match the start line. OPTIONS stays OPTIONS.", "3261-8"),
                    card("200 OK", "The peer answered. The call is a later transaction.", "3261-21"),
                    card("Interval", "Configured on the product. Not an RFC constant.", "5853"),
                ],
                lab={"title": "Check the OPTIONS CSeq", "kind": "dissect", "prompt": "Dissect this keepalive. What is the CSeq method?",
                    "message": opt,
                    "check": check("The CSeq method token is", ["OPTIONS", "INVITE", "ACK", "CANCEL"], 0, "It matches the OPTIONS request line.", "3261-8")},
                fault={"title": "OPTIONS labeled as INVITE", "symptom": "A peer ignores the keepalive. The request line says OPTIONS and the CSeq says INVITE.",
                    "log": "OPTIONS sip:192.0.2.40 SIP/2.0\nVia: SIP/2.0/UDP 203.0.113.20;branch=z9hG4bKoptkeep01\nMax-Forwards: 70\nFrom: <sip:sbc@203.0.113.20>;tag=opt1\nTo: <sip:192.0.2.40>\nCall-ID: opt-keep-1@example.com\nCSeq: 1 INVITE\nContact: <sip:sbc@203.0.113.20>\nContent-Length: 0\n",
                    "choices": ["CSeq method INVITE does not match OPTIONS", "OPTIONS is illegal after RFC 5853", "Max-Forwards 70 disables keepalives", "The peer must answer with 180"],
                    "answer": 0, "why": "RFC 3261 requires the CSeq method to match the request.", "cause": "The keepalive was built with a copied INVITE CSeq.", "fix": "Send CSeq: 1 OPTIONS. Confirm the method in a capture before changing the peer timer.", "cites": cites("3261-8", "3261-11")},
            ),
            lesson(L, id="admission", title="Call admission stays on the datasheet", minutes=12, tags=["admission", "503"],
                summary="An SBC can refuse a new INVITE when its configured budget is exhausted. The number itself is platform-specific.",
                objectives=["Describe admission as a local policy", "Read 503 as one documented failure response", "Refuse invented capacity formulas"],
                illustration={"type": "table", "title": "What is specified where", "caption": "The SIP code is standard. The session budget is not.",
                    "columns": ["Question", "Look here"],
                    "rows": [["What 503 means", "RFC 3261"], ["How many sessions this chassis holds", "Vendor datasheet"], ["Which response this product sends", "That product’s guide"], ["A universal calls-per-second formula", "None in this course"]]},
                sections=[
                    sec("A local refusal",
                        "Call admission is a deployment function: the SBC stops accepting new calls when a configured budget is exhausted. The INVITE in this synthetic is refused with 503 Service Unavailable.",
                        "RFC 3261 defines 503 as the server being unable to handle the request. Some products choose a different final response. The product guide names the code for that software.",
                        "3261-21", "5853"),
                    sec("No invented formula",
                        "The number of concurrent sessions, the media budget, and any calls-per-second ceiling are platform-specific and must come from the vendor datasheet. RFC 5853 does not publish those numbers.",
                        "Do not derive a capacity figure from Max-Forwards, from the UDP port, or from a formula this course does not print. Count the sessions the platform is actually holding and compare that count with the datasheet.",
                        "5853"),
                ],
                flow=flow("INVITE refused at the budget", ["Alice", "SBC"], [
                    hop(0, 1, "INVITE", "req", "A new call arrives while the configured budget is already consumed.", admit),
                    hop(1, 0, "100", "res", "100 Trying only stops retransmissions. It does not admit the call.", msg_resp(100, "Trying", ALICE, BR_A, TAG_A, "", CID_A, "1 INVITE")),
                    hop(1, 0, "503", "res", "503 is this synthetic’s refusal. The datasheet number is not inside the message.", msg_resp(503, "Service Unavailable", ALICE, BR_A, TAG_A, "314159", CID_A, "1 INVITE")),
                    hop(0, 1, "ACK", "req", "ACK for a non-2xx final response completes the transaction.", msg_ack(ALICE, CUBE, BR_A, TAG_A, "314159", CID_A)),
                ]),
                quiz=[
                    quiz_item("Call admission is", ["A local policy that can refuse a new INVITE", "A new SIP method", "An RTP payload", "A DNS SRV weight"], 0, "The SBC applies a budget before it creates the outbound leg.", "5853"),
                    quiz_item("This lesson’s refusal uses", ["503 Service Unavailable", "200 OK with no SDP", "180 Ringing", "301 Moved"], 0, "503 is defined for a server that cannot take the request. Confirm the code your product actually sends.", "3261-21"),
                    quiz_item("The concurrent-session maximum is found in", ["The vendor datasheet", "RFC 3261 section 21", "The Call-ID", "The branch magic cookie"], 0, "The RFC defines the response, not the chassis size.", "5853"),
                    quiz_item("A calls-per-second formula printed only in a blog should be", ["Ignored in favor of the datasheet", "Copied into every SBC", "Written into SDP", "Used as Max-Forwards"], 0, "This course does not invent that formula.", "5853"),
                    quiz_item("100 Trying before a 503 means", ["The hop stopped INVITE retransmissions", "The call is answered", "Media is anchored", "The budget was increased"], 0, "Admission happens with the final response.", "3261-21"),
                    quiz_item("ACK after this 503 is", ["The hop-by-hop ACK for a non-2xx final response", "A new offer", "Proof the call is up", "An OPTIONS keepalive"], 0, "It matches the INVITE transaction.", "3261"),
                ],
                cards=[
                    card("Admission", "Refuse new work when the configured budget is exhausted.", "5853"),
                    card("503", "Service Unavailable. Confirm the product’s actual code.", "3261-21"),
                    card("Datasheet", "The only source for this platform’s session limit.", "5853"),
                    card("No CPS formula", "Do not invent calls-per-second math.", "5853"),
                ],
                lab={"title": "Read the refusal", "kind": "ladder", "prompt": "Step the ladder. Which response refuses the call?",
                    "steps": ["Play until the final response.", "Read the status code.", "Note that no session count is inside SIP."],
                    "check": check("Which status refuses the INVITE in this lab?", ["503", "200", "180", "100"], 0, "100 is provisional. 503 is the refusal.", "3261-21")},
                fault={"title": "A formula in place of the datasheet", "symptom": "Operators keep raising an undocumented calls-per-second number. New INVITEs still receive 503.",
                    "log": "SIP/2.0 503 Service Unavailable\nVia: SIP/2.0/UDP 203.0.113.10;branch=z9hG4bK7766as01\nCSeq: 1 INVITE\nCall-ID: a84b4c76e66710@example.com\nContent-Length: 0\n",
                    "choices": ["The platform session budget is exhausted and the number is on the datasheet", "RFC 5853 sets every SBC to the same calls per second", "503 means the SDP codecs matched", "The ACK created an extra session"],
                    "answer": 0, "why": "The message is a local refusal. It does not contain a formula.", "cause": "Capacity was tuned from an invented counter instead of the vendor datasheet.", "fix": "Read the datasheet for this hardware and software. Compare it with the session count the platform reports. Then set admission in that product’s guide.", "cites": cites("5853", "3261-21")},
            ),
            lesson(L, id="high-availability", title="Active and standby, without a made-up timer", minutes=12, tags=["ha", "standby"],
                summary="Active/standby is a product behavior. One unit owns the work and the other is ready. Timers belong in that product’s HA guide.",
                objectives=["Describe active/standby at product level", "Keep failover timing out of the SIP RFC", "Expect dialog state to be a product problem"],
                illustration={"type": "states", "title": "Roles, not a timer", "caption": "How fast the standby reacts is documented by the vendor.",
                    "nodes": ["Active owns calls", "Standby is ready", "Failure detected", "Read the HA guide"]},
                sections=[
                    sec("What active/standby means",
                        "In an active/standby pair, one unit processes signaling and media and the other is ready to take that role. The SIP dialogs in this ladder exist on the active unit at 203.0.113.20.",
                        "The standby does not appear as a third SIP hop. Whether established dialogs survive a switch is a product behavior, because a B2BUA holds dialog state that a bare packet forward would not.",
                        "7092", "5853"),
                    sec("No failover timer in this course",
                        "Detection methods and failover timing differ by product. This lesson does not invent a failover timer, a hello interval, or a session-recovery count.",
                        "When a design needs a number, take it from the HA chapter for the software version you run. Do not copy a timer from a different chassis and do not look for it in RFC 5853.",
                        "5853"),
                ],
                flow=eight("The standby is not a SIP hop", [
                    "Alice invites the active SBC address.",
                    "100 Trying comes from the active unit.",
                    "The active unit creates the carrier leg. The standby is not in the Via path.",
                    "180 Ringing returns on the carrier dialog.",
                    "The active unit forwards alerting to Alice.",
                    "200 OK returns to the active unit.",
                    "Alice receives 200 OK from the active unit.",
                    "ACK returns to the active unit. Failover timing is not a header.",
                ]),
                quiz=[
                    quiz_item("Active/standby describes", ["A product pair where one unit owns the work", "A new SIP method", "An RTP payload type", "A DNS NAPTR flag"], 0, "It is high-availability behavior, not a protocol role in RFC 3261.", "5853"),
                    quiz_item("The standby in this ladder", ["Does not appear as a SIP hop", "Inserts a second Via on every request", "Sends the ACK", "Replaces the Call-ID"], 0, "SIP shows the active dialogs only.", "7092"),
                    quiz_item("A failover timer should come from", ["The HA guide for that software", "RFC 5853", "The SDP ptime", "Max-Forwards"], 0, "This course intentionally states no timer.", "5853"),
                    quiz_item("Dialog survival across a switch is", ["A product behavior, because a B2BUA holds dialog state", "Guaranteed by RFC 3261 for every proxy", "Encoded in the branch cookie", "Impossible to document"], 0, "The taxonomy explains why state exists. The product explains whether it moves.", "7092"),
                    quiz_item("Inventing a three-second failover value would be", ["Outside both the RFC and this course", "Required by RFC 7092", "A mandatory SDP attribute", "The definition of 100 Trying"], 0, "Timers stay in the product HA chapter.", "5853"),
                    quiz_item("The active signaling address in the shared ladder is", ["203.0.113.20", "192.0.2.40", "198.51.100.30", "Absent"], 0, "That is the SBC address in the lab topology.", "3261"),
                ],
                cards=[
                    card("Active", "The unit currently processing the dialogs.", "5853"),
                    card("Standby", "Ready to take the role. Not a SIP method.", "5853"),
                    card("No timer here", "Do not invent a failover interval.", "5853"),
                    card("Dialog state", "A B2BUA holds it. Survival is a product question.", "7092"),
                ],
                lab={"title": "Count the SIP hops", "kind": "ladder", "prompt": "Play the call. How many SIP roles does the standby occupy in the ladder?",
                    "steps": ["Play all eight hops.", "Name each party.", "Notice the standby is not among them."],
                    "check": check("The standby appears in the SIP ladder as", ["No hop", "The carrier", "The ACK sender", "A third Via"], 0, "HA state is outside the message flow until the product switches.", "5853")},
                fault={"title": "A timer copied from another product", "symptom": "After the active unit stops responding, the standby does not own 203.0.113.20. The design used a failover timer taken from a different vendor’s blog.",
                    "log": "INVITE sip:+15551212@203.0.113.20 SIP/2.0\nVia: SIP/2.0/UDP 203.0.113.10;branch=z9hG4bK7766as01\nCSeq: 1 INVITE\nCall-ID: a84b4c76e66710@example.com\n(no response from 203.0.113.20)\n",
                    "choices": ["Failover timing is product-specific and was not taken from this product’s HA guide", "RFC 5853 sets failover to one SDP ptime", "The Call-ID must change before the standby answers", "100 Trying is the HA heartbeat"],
                    "answer": 0, "why": "The capture shows silence from the active address. It does not contain a universal timer.", "cause": "The pair was operated with a failover value that this product’s guide does not use.", "fix": "Open the HA chapter for the software you run and configure detection as that chapter describes. Do not import a timer from a different platform.", "cites": cites("5853", "7092")},
            ),
        ],
    }


def track_cisco():
    L = ADV
    inbound = msg_invite(CUCM, CUBE, CID_A, BR_A, TAG_A, body="", contact_user="cucm", contact_host=CUCM)
    forced = msg_invite(CUBE, CARRIER, CID_B, BR_B, TAG_B, body=ANCHOR_SDP, contact_user="sbc")
    delayed_ok = msg_resp(200, "OK", CUCM, BR_A, TAG_A, "314159", CID_A, "1 INVITE", extra=[f"Contact: <sip:sbc@{CUBE}>"], body=ANCHOR_SDP)
    alice_ack = msg_ack(CUCM, CUBE, "z9hG4bK7766ack", TAG_A, "314159", CID_A, body=sdp_for(CUCM, "cucm", 18000, pts="0"))
    cucm_invite = msg_invite(CUCM, CUBE, "cucm-trunk-1@example.com", "z9hG4bKcucm01", "cucmtag1", body=sdp_for(CUCM, "cucm", 18000), contact_user="cucm", contact_host=CUCM)
    unity_invite = msg_invite(CUCM, CARRIER, "unity-fwd-1@example.com", "z9hG4bKunity1", "cucmtag1", body="", contact_user="cucm", contact_host=CUCM, extra=["Diversion: <sip:+15551212@example.com>;reason=unconditional"])
    recv = msg_invite(ALICE, CUBE, CID_A, BR_A, TAG_A, extra=["Diversion: <sip:+15551212@example.com>;reason=unconditional"])
    sent = msg_invite(CUBE, CARRIER, CID_B, BR_B, TAG_B, body=ANCHOR_SDP, contact_user="sbc", extra=["Diversion: <sip:+15551212@example.com>;reason=unconditional"])
    capture = ccsip("Received", recv, "Oct 14 12:00:01.100") + ccsip("Sent", sent, "Oct 14 12:00:01.200")
    profile_cfg = "voice class sip-profiles 10\n " + CUBE_RULE + "\n"
    dialpeer_cfg = "dial-peer voice 200 voip\n session protocol sipv2\n session target ipv4:192.0.2.40\n"
    return {
        "id": "cisco",
        "title": "Cisco CUBE, CUCM, and Unity Connection",
        "summary": "CUBE as an IOS XE B2BUA, the dial-peer and SIP profile tools, and the CUCM and Unity documents that use different objects with similar names.",
        "level": L,
        "order": 10,
        "lessons": [
            lesson(L, id="cube-role", title="CUBE is an IOS XE B2BUA", minutes=13, tags=["cube", "b2bua"],
                summary="Cisco Unified Border Element is a B2BUA on IOS XE. It shares the IOS voice stack with other voice features.",
                objectives=["Name CUBE as Cisco Unified Border Element", "Place it in the B2BUA role", "Treat IOS voice behavior as release-specific"],
                illustration={"type": "layers", "title": "CUBE on IOS XE", "caption": "Basic SIP configuration and SIP profiles are separate chapters of the same product.",
                    "layers": [{"name": "IOS XE", "detail": "The voice stack CUBE shares"}, {"name": "CUBE", "detail": "Cisco Unified Border Element, a B2BUA"}, {"name": "Dial peers", "detail": "Where the next hop is selected"}, {"name": "SIP profiles", "detail": "Header changes on a message"}]},
                sections=[
                    sec("The product and the role",
                        "CUBE means Cisco Unified Border Element. On IOS XE it is a B2BUA: a UAS toward the caller and a UAC toward the next hop.",
                        "The basic SIP configuration guide and the SIP profiles guide are the two chapters this track cites for that behavior. RFC 7092 is the taxonomy for the role itself.",
                        "cube-basic", "cube-prof", "7092"),
                    sec("Same voice stack, confirm the release",
                        "CUBE shares the IOS voice stack with other IOS voice features. A control documented for CME or SRST can exist on the same stack, and the reader must confirm behavior on their release.",
                        "Do not treat a blog’s version gate as newer than the guides. Inbound SIP profile support is discussed in the use-case technote. The 17.6 and later profile syntax lives in the SIP profiles guide.",
                        "cube-cases", "cube-prof"),
                    sec("Trusted sources on the shared stack",
                        "Under voice service voip, ip address trusted list names sources the IOS voice stack is willing to accept. The CME toll-fraud chapter and the SRST guide both document that list.",
                        "CUBE shares this stack, so confirm the behavior on your release. The CME and SRST guides do not publish one shared maximum list size, and this course states no maximum. The list is a defensive control for peers you intend to accept, such as 198.51.100.30 and 192.0.2.40.",
                        "cme-toll", "srst-toll"),
                ],
                flow=eight("CUBE between the phone and the carrier", [
                    "The phone invites CUBE at 203.0.113.20.",
                    "CUBE answers 100 Trying as the UAS.",
                    "CUBE creates the carrier INVITE as the UAC.",
                    "The carrier sends 180 Ringing on its dialog.",
                    "CUBE forwards alerting toward the phone.",
                    "The carrier sends 200 OK with SDP.",
                    "CUBE sends 200 OK on the caller dialog.",
                    "The phone ACK completes the caller leg.",
                ]),
                quiz=[
                    quiz_item("CUBE expands to", ["Cisco Unified Border Element", "Cisco Universal Bypass Engine", "Central User Billing Element", "A pure SIP proxy defined by RFC 3261"], 0, "It is the IOS XE border element.", "cube-basic"),
                    quiz_item("CUBE’s SIP role is", ["B2BUA", "Stateless forwarder only", "A DNS resolver", "A registrar only"], 0, "UAS on one side and UAC on the other.", "7092"),
                    quiz_item("The 17.6 and later profile chapter cited here is", ["The CUBE SIP profiles guide", "RFC 5853", "The Unity Connection series page", "The CME toll-fraud chapter"], 0, "That guide is the cube-prof citation.", "cube-prof"),
                    quiz_item("CUBE shares", ["The IOS voice stack", "A private SIP method with no RFC", "The Teams SIP proxy", "Only SCCP"], 0, "Confirm stack behavior on the release you run.", "cube-basic"),
                    quiz_item("ip address trusted list is documented in", ["The CME toll-fraud chapter and the SRST guide, which differ on list size", "One maximum shared by both guides", "RFC 5853", "A Unity mailbox page"], 0, "Confirm CUBE behavior on your release. State no single maximum.", "cme-toll"),
                    quiz_item("Inbound profile history in the use-case technote starts", ["After Cisco IOS 15.4", "At a version this lesson invents past 17.6", "In RFC 7092", "With Unity Connection"], 0, "Do not invent a newer gate than the technote and the 17.6 guide.", "cube-cases"),
                ],
                cards=[
                    card("CUBE", "Cisco Unified Border Element. An IOS XE B2BUA.", "cube-basic"),
                    card("IOS XE", "The operating system whose voice stack CUBE uses.", "cube-basic"),
                    card("SIP profiles", "Header modifications. Guide for 17.6 and later.", "cube-prof"),
                    card("B2BUA", "The role RFC 7092 taxonomizes.", "7092"),
                ],
                lab={"title": "Walk a CUBE call", "kind": "ladder", "prompt": "Play the ladder and name the B2BUA hop.",
                    "steps": ["Play the call.", "Find 203.0.113.20.", "Separate the caller dialog from the carrier dialog."],
                    "check": check("Which address is the CUBE in this synthetic?", ["203.0.113.20", "203.0.113.10", "192.0.2.40", "198.51.100.30"], 0, "The phone is .10, CUBE is .20, the carrier is 192.0.2.40.", "cube-basic")},
                fault={"title": "Reading CUBE as a proxy", "symptom": "The carrier packet has a new Call-ID. The review calls the call broken because Alice’s Via is gone.",
                    "log": msg_invite(CUBE, CARRIER, CID_B, BR_B, TAG_B, body=ANCHOR_SDP, contact_user="sbc"),
                    "choices": ["CUBE built a new UAC request, which is B2BUA behavior", "CUBE must copy every Via or the call violates RFC 3261", "A new Call-ID is illegal on IOS XE", "SDP c= must stay 203.0.113.10"],
                    "answer": 0, "why": "Call-ID b2bua-legb-01@example.com belongs to the outbound dialog.", "cause": "Proxy forwarding rules were applied to a B2BUA.", "fix": "Use the CUBE basic configuration guide for the product and RFC 7092 for the role. Compare both legs instead of expecting one Via stack.", "cites": cites("cube-basic", "7092")},
            ),
            lesson(L, id="dial-peers", title="Dial peers select the SIP next hop", minutes=13, tags=["dial-peer", "cube"],
                summary="dial-peer voice N voip, session protocol sipv2, and session target ipv4: name a SIP next hop.",
                objectives=["Read the three documented dial-peer lines", "Point session target at the intended peer", "Keep extra IOS commands out of this lesson"],
                illustration={"type": "table", "title": "Lines this lesson is allowed to teach", "caption": "Matching keys beyond these lines are in the configuration guide for your release.",
                    "columns": ["Line", "What it does in this lab"],
                    "rows": [["dial-peer voice 200 voip", "Creates VoIP dial peer 200"], ["session protocol sipv2", "Uses SIP"], ["session target ipv4:192.0.2.40", "Sends that peer to the carrier"]]},
                sections=[
                    sec("Three lines",
                        "A CUBE next hop is a dial peer. The form taught here is dial-peer voice N voip, then session protocol sipv2, then session target ipv4: followed by the peer address.",
                        "In the synthetic, dial peer 200 targets 192.0.2.40, the carrier. Dial peer 100 in a design toward CUCM would target 198.51.100.30. N is the tag you choose.",
                        "cube-basic"),
                    sec("What this lesson leaves in the guide",
                        "Inbound matching and outbound destination patterns are real IOS behavior. The basic configuration guide for your release is where those commands are printed.",
                        "This lesson does not add command lines beyond the three above. If a call hits the wrong peer, capture the outbound INVITE and compare the Request-URI host with session target ipv4:.",
                        "cube-basic", "3261"),
                ],
                flow=flow("session target becomes the Request-URI host", ["CUCM", "CUBE", "Carrier"], [
                    hop(0, 1, "INVITE", "req", "CUCM at 198.51.100.30 invites CUBE.", cucm_invite),
                    hop(1, 0, "100", "res", "CUBE accepts the inbound dialog.", msg_resp(100, "Trying", CUCM, "z9hG4bKcucm01", "cucmtag1", "", "cucm-trunk-1@example.com", "1 INVITE")),
                    hop(1, 2, "INVITE", "req", "The outbound Request-URI host is the session target.", msg_invite(CUBE, CARRIER, CID_B, BR_B, TAG_B, body=ANCHOR_SDP, contact_user="sbc")),
                    hop(2, 1, "100", "res", "The carrier answers the new transaction.", msg_resp(100, "Trying", CUBE, BR_B, TAG_B, "", CID_B, "1 INVITE")),
                ]),
                quiz=[
                    quiz_item("session protocol sipv2 selects", ["SIP", "MGCP only", "H.323 only", "DNS without SIP"], 0, "The dial peer is a VoIP SIP peer.", "cube-basic"),
                    quiz_item("session target ipv4:192.0.2.40 sends the call to", ["192.0.2.40", "203.0.113.10", "The phone’s SDP port", "The Call-ID host"], 0, "The address after ipv4: is the next hop.", "cube-basic"),
                    quiz_item("dial-peer voice 200 voip creates", ["VoIP dial peer 200", "A SIP profile", "A CUCM trunk", "A Unity mailbox"], 0, "200 is the tag chosen in this example.", "cube-basic"),
                    quiz_item("The phone address in this lab is", ["203.0.113.10", "The session target of dial peer 200", "198.51.100.30", "192.0.2.40"], 0, "Pointing the carrier dial peer at the phone sends the call backward.", "cube-basic"),
                    quiz_item("CUCM’s lab address is", ["198.51.100.30", "192.0.2.40", "203.0.113.10", "The Via branch"], 0, "A dial peer toward CUCM targets that address.", "cube-basic"),
                    quiz_item("Extra matching commands belong", ["In the configuration guide for the release", "In RFC 5853", "In the SDP fmtp line", "In this lesson as invented syntax"], 0, "Stay with the three documented lines unless you have the guide open.", "cube-basic"),
                ],
                cards=[
                    card("dial-peer voice N voip", "Creates the VoIP dial peer numbered N.", "cube-basic"),
                    card("session protocol sipv2", "This dial peer speaks SIP.", "cube-basic"),
                    card("session target ipv4:", "The next-hop IPv4 address.", "cube-basic"),
                    card("192.0.2.40", "Carrier address in this synthetic.", "5737"),
                ],
                lab={"title": "Read dial peer 200", "kind": "config", "prompt": "This is the carrier dial peer. Where will CUBE send the outbound INVITE?",
                    "config": dialpeer_cfg,
                    "steps": ["Read session protocol.", "Read session target.", "Name the address."],
                    "check": check("session target sends the call to", ["192.0.2.40", "203.0.113.10", "203.0.113.20", "198.51.100.30"], 0, "The address is written after ipv4:.", "cube-basic")},
                fault={"title": "session target points at the phone", "symptom": "Outbound INVITEs leave CUBE toward 203.0.113.10 and the carrier never sees the call.",
                    "log": "dial-peer voice 200 voip\n session protocol sipv2\n session target ipv4:203.0.113.10\nINVITE sip:+15551212@203.0.113.10 SIP/2.0\nVia: SIP/2.0/UDP 203.0.113.20;branch=z9hG4bK7766as02\n",
                    "choices": ["The session target is the phone address instead of the carrier", "sipv2 disables IPv4 targets", "Dial peer 200 cannot use SIP", "The branch cookie selects the next hop"],
                    "answer": 0, "why": "ipv4:203.0.113.10 is Alice, not 192.0.2.40.", "cause": "The next hop was configured as the caller.", "fix": "Set session target ipv4:192.0.2.40 on the carrier dial peer and capture the outbound Request-URI host.", "cites": cites("cube-basic", "3261")},
            ),
            lesson(L, id="sip-profiles", title="voice class sip-profiles", minutes=15, tags=["sip-profiles", "cube"],
                summary="A voice class sip-profiles rule can add, modify, or remove a header on a named method. Inbound support arrived after Cisco IOS 15.4.",
                objectives=["Read request INVITE sip-header rules", "Separate this object from a CUCM SIP profile", "Test a rule before blaming the carrier"],
                illustration={"type": "table", "title": "Profile actions in the documented syntax", "caption": "The lab removes Diversion. modify and add are the other two actions.",
                    "columns": ["Action", "Form"],
                    "rows": [["remove", "request INVITE sip-header Diversion remove"], ["modify", "request INVITE sip-header NAME modify"], ["add", "request INVITE sip-header NAME add"], ["Where syntax lives", "SIP profiles guide, 17.6 and later"]]},
                sections=[
                    sec("The rule this lab runs",
                        "voice class sip-profiles 10 holds the rule request INVITE sip-header Diversion remove. The same grammar accepts modify or add in place of remove, with the header name in that position.",
                        "Applied to an INVITE, remove deletes the named header. The Collaboration Solutions Analyzer SIP Profile Tester is the documented place to try a rule against a message before you load it on a router.",
                        "cube-prof", "cube-csa"),
                    sec("Inbound support and the version gate",
                        "The SIP profile use-case technote says inbound profile support arrived after Cisco IOS 15.4. The 17.6 and later configuration guide is the profiles chapter cited here.",
                        "This lesson does not invent a newer version gate. Confirm on your release whether the profile is applied inbound or outbound, and do not confuse this IOS object with the SIP Profile object on CUCM.",
                        "cube-cases", "cube-prof"),
                ],
                flow=flow("Diversion present, then removed on the copy you test", ["Alice", "CUBE", "Carrier"], [
                    hop(0, 1, "INVITE", "req", "The inbound INVITE still carries Diversion.", recv),
                    hop(1, 0, "100", "res", "CUBE has accepted the caller transaction.", msg_resp(100, "Trying", ALICE, BR_A, TAG_A, "", CID_A, "1 INVITE")),
                    hop(1, 2, "INVITE", "req", "Until the profile is applied, the outbound copy still shows Diversion.", sent),
                    hop(2, 1, "100", "res", "The carrier transaction is independent.", msg_resp(100, "Trying", CUBE, BR_B, TAG_B, "", CID_B, "1 INVITE")),
                ]),
                quiz=[
                    quiz_item("request INVITE sip-header Diversion remove", ["Deletes Diversion on a matching INVITE", "Adds a Diversion header", "Changes the SDP codec", "Blocks OPTIONS"], 0, "remove is the documented action used in the lab.", "cube-prof"),
                    quiz_item("voice class sip-profiles is", ["An IOS XE CUBE object", "The CUCM SIP Profile checkbox", "A Unity mailbox map", "An RTP payload"], 0, "CUCM uses a different object with a similar English name.", "cube-prof"),
                    quiz_item("Inbound profile support, per the use-case technote, arrived", ["After Cisco IOS 15.4", "In RFC 3261", "Only on Unity Connection", "At a version this course invents"], 0, "Do not add a later gate than the technote states.", "cube-cases"),
                    quiz_item("The profiles guide cited for 17.6 and later is", ["The CUBE SIP profiles configuration guide", "The CME toll-fraud chapter", "RFC 7092", "The Five9 BYO SIP page"], 0, "Use that guide for current syntax.", "cube-prof"),
                    quiz_item("Collaboration Solutions Analyzer SIP Profile Tester is for", ["Trying a profile against a message", "Replacing dial peers", "Issuing certificates", "Counting calls per second"], 0, "It is the documented tester, cited as cube-csa.", "cube-csa"),
                    quiz_item("modify and add are", ["The other two actions in the same sip-header grammar", "Illegal on INVITE", "RTP directions", "CUCM Lua functions"], 0, "The form is modify or add or remove.", "cube-prof"),
                ],
                cards=[
                    card("sip-profiles", "voice class sip-profiles N holds the rules.", "cube-prof"),
                    card("remove", "request INVITE sip-header Diversion remove.", "cube-prof"),
                    card("After 15.4", "Inbound profile support, per the use-case technote.", "cube-cases"),
                    card("CSA tester", "Try the profile before loading it.", "cube-csa"),
                ],
                lab={"title": "Remove Diversion", "kind": "sandbox", "dialect": "cube", "prompt": "Run the CUBE subset rule against the inbound INVITE. Diversion should disappear.",
                    "rules": profile_cfg,
                    "message": recv,
                    "steps": ["Read the voice class rule.", "Run it on the INVITE.", "Confirm Diversion is gone."],
                    "check": check("After request INVITE sip-header Diversion remove, Diversion is", ["Removed", "Copied into SDP", "Renamed to Via", "Required by RFC 3261"], 0, "The teaching subset deletes that header on the INVITE.", "cube-prof")},
                fault={"title": "Diversion still on the outbound INVITE", "symptom": "The carrier complains about Diversion. debug output still shows the header on the sent INVITE.",
                    "log": "Sent:\nINVITE sip:+15551212@192.0.2.40 SIP/2.0\nDiversion: <sip:+15551212@example.com>;reason=unconditional\nCSeq: 1 INVITE\n",
                    "choices": ["The remove rule is not applied to the INVITE that is sent", "RFC 5806 forbids removing Diversion on any B2BUA", "session protocol sipv2 reinserts Diversion", "A 100 Trying adds Diversion"],
                    "answer": 0, "why": "The sent INVITE still contains the header the rule was supposed to delete.", "cause": "The voice class rule is missing on the dial peer that sends this INVITE, or inbound application was assumed on a release that has not been checked.", "fix": "Put request INVITE sip-header Diversion remove in the profile, apply it on the correct leg, and confirm inbound support against the use-case technote. Inbound support arrived after Cisco IOS 15.4. Test the text in the Collaboration Solutions Analyzer SIP Profile Tester.", "cites": cites("cube-prof", "cube-cases", "cube-csa")},
            ),
            lesson(L, id="early-delayed", title="Early offer and delayed offer", minutes=15, tags=["offer", "early-offer"],
                summary="Delayed offer means the INVITE has no SDP. voice-class sip early-offer forced makes the outbound dial peer send an offer in the INVITE.",
                objectives=["Define delayed offer", "State where RFC 3264 allows an offer", "Name the CUBE command that forces early offer"],
                illustration={"type": "states", "title": "Two legs, two timings", "caption": "RFC 3264 allows the offer in the INVITE or in a reliable response.",
                    "nodes": ["INVITE without SDP", "early-offer forced", "Outbound INVITE with SDP", "Answer on that leg"]},
                sections=[
                    sec("Where the offer may sit",
                        "Delayed offer means the INVITE has no SDP. The offer comes later. RFC 3264 allows the offer in the INVITE or in a reliable response.",
                        "If the offer arrives in a reliable 18x, PRACK carries the answer and 100rel applies. If the offer arrives in the 200 OK, the ACK carries the answer. The caller leg in this synthetic follows that second pattern.",
                        "3264", "3262"),
                    sec("Forcing early offer on CUBE",
                        "voice-class sip early-offer forced is the documented way to force early offer on a dial peer. The outbound INVITE then contains SDP even though the inbound INVITE from 198.51.100.30 did not.",
                        "The two legs can therefore use different offer/answer timings. Capture both. Do not assume the SDP bytes match until you read them.",
                        "cube-basic", "3264"),
                ],
                flow=flow("Delayed inbound, early outbound", ["CUCM", "CUBE", "Carrier"], [
                    hop(0, 1, "INVITE", "req", "Inbound INVITE has no SDP. This is delayed offer.", inbound),
                    hop(1, 0, "100", "res", "CUBE is not yet offering media to CUCM.", msg_resp(100, "Trying", CUCM, BR_A, TAG_A, "", CID_A, "1 INVITE")),
                    hop(1, 2, "INVITE", "req", "early-offer forced puts SDP on the carrier INVITE.", forced),
                    hop(2, 1, "200", "res", "The carrier’s 200 OK is the answer to that outbound offer.", msg_resp(200, "OK", CUBE, BR_B, TAG_B, TAG_C, CID_B, "1 INVITE", extra=[f"Contact: <sip:bob@{CARRIER}>"], body=CARRIER_SDP)),
                    hop(1, 0, "200", "res", "Toward the delayed-offer caller, this 200 OK carries the offer.", delayed_ok),
                    hop(0, 1, "ACK", "req", "The caller’s ACK carries the answer for that offer.", alice_ack),
                ]),
                quiz=[
                    quiz_item("Delayed offer means", ["The INVITE has no SDP", "The INVITE contains the only legal SDP", "ACK is forbidden", "OPTIONS replaced INVITE"], 0, "The offer shows up in a later reliable response.", "3264"),
                    quiz_item("RFC 3264 allows the offer in", ["The INVITE or a reliable response", "ACK only", "REGISTER only", "A 100 Trying body"], 0, "100 Trying is not a reliable place for the offer.", "3264"),
                    quiz_item("voice-class sip early-offer forced", ["Forces early offer on that dial peer", "Removes all SDP", "Enables a CUCM Lua script", "Sets the trusted IP list"], 0, "It is the documented CUBE command for this job.", "cube-basic"),
                    quiz_item("On the carrier leg in this lesson, SDP first appears in", ["The outbound INVITE", "The inbound INVITE", "The 100 Trying", "A REGISTER"], 0, "That is the forced early offer.", "3264"),
                    quiz_item("When the offer is in the 200 OK, the answer belongs in", ["The ACK", "A second INVITE with no Call-ID", "OPTIONS", "The Via branch"], 0, "That is the delayed-offer caller leg in this synthetic.", "3264"),
                    quiz_item("A reliable provisional offer depends on", ["100rel and PRACK", "A datasheet CPS formula", "SCCP", "An empty Contact"], 0, "RFC 3262 is the reliability mechanism.", "3262"),
                ],
                cards=[
                    card("Delayed offer", "INVITE without SDP. Offer comes later.", "3264"),
                    card("Early offer", "The INVITE already contains the offer.", "3264"),
                    card("early-offer forced", "Dial-peer command that forces an outbound offer.", "cube-basic"),
                    card("ACK answer", "Used when the offer arrived in the 200 OK.", "3264"),
                ],
                lab={"title": "Read the forced offer", "kind": "sdp", "prompt": "The outbound early offer is ANCHOR_SDP. The carrier answer is CARRIER_SDP.",
                    "offer": ANCHOR_SDP, "answer": CARRIER_SDP,
                    "check": check("The outbound offer’s c= address is", ["203.0.113.20", "198.51.100.30", "203.0.113.10", "Absent because the INVITE had no SDP"], 0, "CUBE offered its own address. The inbound INVITE was the one without SDP.", "3264")},
                fault={"title": "Carrier required an offer", "symptom": "The carrier rejects the call. The outbound INVITE matches the inbound one: no SDP.",
                    "log": "INVITE sip:+15551212@192.0.2.40 SIP/2.0\nVia: SIP/2.0/UDP 203.0.113.20;branch=z9hG4bK7766as02\nCSeq: 1 INVITE\nContact: <sip:sbc@203.0.113.20>\nContent-Length: 0\n",
                    "choices": ["The outbound dial peer forwarded delayed offer and early-offer forced is not set", "RFC 3264 forbids SDP in any INVITE", "A missing SDP is always early offer", "100 Trying should have carried the offer"],
                    "answer": 0, "why": "Content-Length 0 on that INVITE means no offer was sent.", "cause": "The inbound delayed offer was forwarded to a peer that requires an offer in the INVITE.", "fix": "Configure voice-class sip early-offer forced on the outbound dial peer and capture again. Confirm the outbound INVITE contains SDP.", "cites": cites("cube-basic", "3264")},
            ),
            lesson(L, id="cucm-trunk", title="CUCM trunks, SIP profiles, and Lua", minutes=14, tags=["cucm", "trunk", "lua"],
                summary="A CUCM SIP trunk and a CUCM SIP profile are not the CUBE voice class. Lua normalization scripts exist. MTP required is version-specific.",
                objectives=["Separate CUCM objects from CUBE sip-profiles", "Remember that Lua scripts exist", "Confirm MTP required in the guide for that version"],
                illustration={"type": "table", "title": "Same words, different objects", "caption": "Do not configure one product with the other product’s syntax.",
                    "columns": ["Name you hear", "What it is"],
                    "rows": [["CUBE voice class sip-profiles", "IOS XE header rules"], ["CUCM SIP profile", "A CUCM trunk setting object"], ["Lua normalization script", "A CUCM script on a trunk"], ["MTP required", "A CUCM trunk setting in that version’s admin guide"]]},
                sections=[
                    sec("Trunks and two different profiles",
                        "CUCM places calls to CUBE, to a carrier, or to another cluster on a SIP trunk. The lab trunk source is 198.51.100.30 and the CUBE address is 203.0.113.20.",
                        "A SIP profile on CUCM is the CUCM object. It is different from CUBE voice class sip-profiles. Lua normalization scripts exist on CUCM for message changes. This lesson does not invent a menu click-path or a script API.",
                        "cucm", "cube-prof"),
                    sec("MTP required",
                        "MTP required is a CUCM trunk setting documented in the admin guide for that version — confirm the guide before you check the box. Open the admin guide for the version you run before you enable it.",
                        "An MTP inserts a media resource and can change when SDP appears. The synthetic failure in this lesson shows CUCM offering c=198.51.100.30 after the phone offered from 203.0.113.10, which is a reason to read that guide rather than a reason to guess.",
                        "cucm", "3264"),
                ],
                flow=flow("CUCM trunk to CUBE", ["Phone", "CUCM", "CUBE"], [
                    hop(0, 1, "INVITE", "req", "The phone invites CUCM with its own SDP.", msg_invite(ALICE, CUCM, CID_A, BR_A, TAG_A, body=PHONE_SDP)),
                    hop(1, 0, "100", "res", "CUCM is the UAS for the phone dialog.", msg_resp(100, "Trying", ALICE, BR_A, TAG_A, "", CID_A, "1 INVITE")),
                    hop(1, 2, "INVITE", "req", "The trunk INVITE is a new request toward CUBE.", cucm_invite),
                    hop(2, 1, "100", "res", "CUBE accepts the trunk dialog.", msg_resp(100, "Trying", CUCM, "z9hG4bKcucm01", "cucmtag1", "", "cucm-trunk-1@example.com", "1 INVITE")),
                ]),
                quiz=[
                    quiz_item("A CUCM SIP profile is", ["A CUCM object, different from voice class sip-profiles", "The same CLI object as CUBE", "An RTP codec", "A DNS record"], 0, "The English word profile is used by both products.", "cucm"),
                    quiz_item("Lua normalization scripts", ["Exist on CUCM for SIP message changes", "Are the CUBE profile grammar", "Replace RFC 3261", "Are configured under voice class sip-profiles"], 0, "Cite the CUCM documentation. Do not invent a click-path.", "cucm"),
                    quiz_item("MTP required", ["Is a CUCM trunk setting in the admin guide for that version", "Is a CUBE command taught as voice-class sip early-offer forced", "Is defined by RFC 5853", "Disables SIP"], 0, "Confirm the guide before you check the box.", "cucm"),
                    quiz_item("In this lab CUCM’s address is", ["198.51.100.30", "203.0.113.10", "192.0.2.40", "The Call-ID"], 0, "CUBE is 203.0.113.20.", "cucm"),
                    quiz_item("Checking MTP required without the version guide is", ["A guess this course tells you not to make", "Required on every trunk", "The same as early-offer forced", "How you create a Lua script"], 0, "The setting can change SDP timing.", "cucm"),
                    quiz_item("The trunk INVITE toward CUBE is", ["A new SIP request generated by CUCM", "A pure proxy copy with Alice’s Via stack guaranteed", "An OPTIONS keepalive", "A REGISTER"], 0, "CUCM is a B2BUA-style call agent on a typical SIP trunk.", "3261"),
                ],
                cards=[
                    card("SIP trunk", "CUCM’s adjacency to CUBE or another peer.", "cucm"),
                    card("CUCM SIP profile", "Not voice class sip-profiles.", "cucm"),
                    card("Lua", "Normalization scripts exist. Open the admin guide.", "cucm"),
                    card("MTP required", "Confirm the guide for that version before checking it.", "cucm"),
                ],
                lab={"title": "Dissect the trunk INVITE", "kind": "dissect", "prompt": "This INVITE leaves CUCM toward CUBE. Which host is in Contact?",
                    "message": cucm_invite,
                    "check": check("Contact host on the trunk INVITE is", ["198.51.100.30", "203.0.113.10", "192.0.2.40", "example.com only"], 0, "CUCM used its own Contact on the trunk dialog.", "cucm")},
                fault={"title": "MTP inserted without reading the guide", "symptom": "The phone offered media from 203.0.113.10. The trunk INVITE offers c=198.51.100.30 and the call fails when that address is not a valid media path.",
                    "log": "INVITE sip:+15551212@203.0.113.20 SIP/2.0\nContact: <sip:cucm@198.51.100.30>\nContent-Type: application/sdp\nc=IN IP4 198.51.100.30\nm=audio 18000 RTP/AVP 0\n",
                    "choices": ["MTP required may have inserted CUCM into the media path", "RFC 3264 forbids c= lines", "CUBE dial peers rewrite CUCM SDP by default in every release", "The Via branch is the media address"],
                    "answer": 0, "why": "The connection address became the CUCM address.", "cause": "MTP required is enabled, or another media resource is inserted, without a check against this version’s admin guide.", "fix": "MTP required is a CUCM trunk setting documented in the admin guide for that version — confirm the guide before you check the box.", "cites": cites("cucm", "3264")},
            ),
            lesson(L, id="unity", title="Unity Connection SIP integration", minutes=13, tags=["unity", "diversion"],
                summary="SIP integration with CUCM is the documented Unity Connection path. Open the guide for your version. This lesson does not make SCCP the default.",
                objectives=["State that SIP integration is the documented path", "Use Diversion as a redirecting-number example", "Open the version’s integration guide"],
                illustration={"type": "layers", "title": "Forwarded call into voicemail", "caption": "In this synthetic, 192.0.2.40 stands for the Unity Connection SIP peer.",
                    "layers": [{"name": "Phone", "detail": "203.0.113.10"}, {"name": "CUCM", "detail": "198.51.100.30 forwards the call"}, {"name": "Unity Connection", "detail": "SIP integration, address from your guide"}]},
                sections=[
                    sec("The documented path",
                        "Unity Connection SIP integration with CUCM is documented. SIP integration is the documented path in Cisco’s Unity Connection SIP integration guides, and the reader should open the guide for their version.",
                        "This lesson does not invent SCCP as the current default. It also does not invent a port, a mailbox wizard, or a click-path. Those details are in the guide you open.",
                        "unity", "cucm"),
                    sec("How the mailbox is indicated in SIP",
                        "A forwarded INVITE can carry Diversion with the original called number. Here that value is sip:+15551212@example.com and the reason is unconditional.",
                        "History-Info is the other standards-based redirecting header. Whether this version of Unity Connection wants Diversion, History-Info, or both is answered by the SIP integration guide, not by a guess.",
                        "5806", "7044", "unity"),
                ],
                flow=flow("CUCM forwards to the Unity SIP peer", ["Phone", "CUCM", "Unity"], [
                    hop(0, 1, "INVITE", "req", "The caller reaches CUCM first.", msg_invite(ALICE, CUCM, CID_A, BR_A, TAG_A)),
                    hop(1, 0, "100", "res", "CUCM is processing the call.", msg_resp(100, "Trying", ALICE, BR_A, TAG_A, "", CID_A, "1 INVITE")),
                    hop(1, 2, "INVITE", "req", "The forwarded INVITE carries Diversion. 192.0.2.40 is the synthetic Unity peer.", unity_invite),
                    hop(2, 1, "200", "res", "Unity answers the forwarded dialog.", msg_resp(200, "OK", CUCM, "z9hG4bKunity1", "cucmtag1", TAG_U, "unity-fwd-1@example.com", "1 INVITE", extra=[f"Contact: <sip:unity@{CARRIER}>"], body=CARRIER_SDP)),
                ]),
                quiz=[
                    quiz_item("The documented Unity Connection integration path in Cisco’s SIP integration guides is", ["SIP integration with CUCM", "SCCP as a course-defined current default", "SMTP only", "A CUBE voice class"], 0, "Open the guide for the version you run.", "unity"),
                    quiz_item("This lesson treats SCCP as", ["Not the current default it is willing to invent", "The required protocol", "A SIP header", "An SDP proto"], 0, "Do not invent SCCP as the default.", "unity"),
                    quiz_item("Diversion in the synthetic names", ["sip:+15551212@example.com", "The RTP port", "The Via branch", "A mailbox wizard click"], 0, "That is the original called number in this lab.", "5806"),
                    quiz_item("History-Info is specified by", ["RFC 7044", "RFC 4733", "The CUBE dial-peer command", "RFC 3550"], 0, "It is the other redirecting-header family.", "7044"),
                    quiz_item("The Unity peer address on a real cluster comes from", ["The SIP integration guide for that version", "A fixed address in RFC 3261", "The Teams proxy FQDN", "The SDP ptime"], 0, "192.0.2.40 is only the synthetic stand-in.", "unity"),
                    quiz_item("CUCM’s role on this call is", ["The integration partner that forwards the call", "A DNS SRV record only", "The RTP mixer defined by RFC 3550", "An OPTIONS keepalive"], 0, "The series documents cover CUCM and Unity Connection together.", "cucm"),
                ],
                cards=[
                    card("SIP integration", "The documented Unity Connection path. Open your version’s guide.", "unity"),
                    card("Diversion", "RFC 5806 redirecting number. Reason unconditional in the lab.", "5806"),
                    card("History-Info", "RFC 7044. Use it if the guide asks for it.", "7044"),
                    card("Not SCCP-by-guess", "Do not invent SCCP as the current default.", "unity"),
                ],
                lab={"title": "Find the called number", "kind": "dissect", "prompt": "Dissect the forwarded INVITE. Which header carries +15551212 as the redirecting target?",
                    "message": unity_invite,
                    "check": check("The redirecting header in this INVITE is", ["Diversion", "Via", "Max-Forwards", "Allow"], 0, "Diversion contains sip:+15551212@example.com.", "5806")},
                fault={"title": "Forwarded INVITE without a redirecting number", "symptom": "Unity Connection answers, then cannot select a mailbox. The INVITE has no Diversion and no History-Info.",
                    "log": "INVITE sip:+15551212@192.0.2.40 SIP/2.0\nVia: SIP/2.0/UDP 198.51.100.30;branch=z9hG4bKunity1\nFrom: \"Alice\" <sip:alice@example.com>;tag=cucmtag1\nTo: <sip:+15551212@example.com>\nCall-ID: unity-fwd-1@example.com\nCSeq: 1 INVITE\nContact: <sip:cucm@198.51.100.30>\nContent-Length: 0\n",
                    "choices": ["The original called number was not conveyed to Unity Connection", "SIP integration is unsupported", "SCCP is required because Content-Length is 0", "CSeq must be 0 OPTIONS"],
                    "answer": 0, "why": "Neither Diversion nor History-Info is present.", "cause": "The forward did not carry the redirecting identity this integration needs.", "fix": "Open the Unity Connection SIP integration guide for your version and send the redirecting header that guide documents. SIP integration is the documented path.", "cites": cites("unity", "5806", "7044")},
            ),
            lesson(L, id="debug-ccsip", title="debug ccsip messages", minutes=14, tags=["debug", "capture", "cube"],
                summary="debug ccsip messages displays sent and received SIP. Profile decisions have a separate debug, and the analyzer can test a profile offline.",
                objectives=["Read Sent and Received in debug ccsip messages", "Name the profile debug", "Use the analyzer as a dry run"],
                illustration={"type": "table", "title": "Three troubleshooting tools", "caption": "Only debug ccsip messages is turned into the capture lab.",
                    "columns": ["Tool", "What the guide says"],
                    "rows": [["debug ccsip messages", "Displays sent and received SIP"], ["debug ccsip feature sip-profiles", "Profile troubleshooting"], ["SIP Profile Tester", "Collaboration Solutions Analyzer"]]},
                sections=[
                    sec("Sent and Received",
                        "debug ccsip messages displays the SIP CUBE sends and the SIP CUBE receives. The capture lab uses a synthetic of that output, with a timestamp prefix and Sent: and Received: lines.",
                        "Read the received INVITE and the sent INVITE as two messages. In this sample both still contain Diversion, which is the clue that the profile has not changed the outbound request.",
                        "cube-basic"),
                    sec("When the header did not change",
                        "debug ccsip feature sip-profiles is documented for profile troubleshooting. Use it when debug ccsip messages shows that a header survived.",
                        "The Collaboration Solutions Analyzer SIP Profile Tester runs a profile against a pasted message. It does not replace a capture from the router you are actually running.",
                        "cube-prof", "cube-csa"),
                ],
                flow=flow("The messages the debug is showing", ["Alice", "CUBE", "Carrier"], [
                    hop(0, 1, "INVITE", "req", "This is the Received INVITE in the capture.", recv),
                    hop(1, 0, "100", "res", "Provisional responses also appear in a full debug.", msg_resp(100, "Trying", ALICE, BR_A, TAG_A, "", CID_A, "1 INVITE")),
                    hop(1, 2, "INVITE", "req", "This is the Sent INVITE in the capture.", sent),
                    hop(2, 1, "100", "res", "The carrier’s Trying would be another Received block.", msg_resp(100, "Trying", CUBE, BR_B, TAG_B, "", CID_B, "1 INVITE")),
                ]),
                quiz=[
                    quiz_item("debug ccsip messages displays", ["Sent and received SIP", "Only RTP audio", "Only dial-peer configuration", "Certificate private keys"], 0, "That is the basic configuration guide’s message debug.", "cube-basic"),
                    quiz_item("debug ccsip feature sip-profiles is for", ["Profile troubleshooting", "Replacing show version", "Unity mailbox selection", "DNS enumeration"], 0, "Use it when a profile does not do what the message debug shows.", "cube-prof"),
                    quiz_item("The Collaboration Solutions Analyzer tool cited here is", ["The SIP Profile Tester", "A toll-fraud generator", "An RTP mixer", "A CUCM LDAP wizard"], 0, "It tests profile text against a message.", "cube-csa"),
                    quiz_item("In the capture, Received is", ["Alice’s INVITE toward CUBE", "An OPTIONS with CSeq INVITE", "A 603 response", "Empty"], 0, "The timestamped Received block starts with INVITE.", "cube-basic"),
                    quiz_item("A timestamp prefix on debug output is", ["Stripped by a careful reader before the SIP start line is judged", "Part of the SIP method", "A substitute for Call-ID", "Illegal on IOS XE"], 0, "The SIP message begins at the start line.", "3261"),
                    quiz_item("If Sent still shows Diversion, the next useful check is", ["The profile debug and the analyzer", "A new calls-per-second formula", "Deleting Call-ID", "Switching the call to SCCP by guess"], 0, "The message debug already proved the header survived.", "cube-prof"),
                ],
                cards=[
                    card("debug ccsip messages", "Shows sent and received SIP.", "cube-basic"),
                    card("sip-profiles debug", "debug ccsip feature sip-profiles.", "cube-prof"),
                    card("CSA", "SIP Profile Tester in Collaboration Solutions Analyzer.", "cube-csa"),
                    card("Sent / Received", "Direction markers around each SIP message.", "cube-basic"),
                ],
                lab={"title": "Parse a synthetic debug", "kind": "capture", "prompt": "This is synthetic debug ccsip messages output. Separate Received from Sent.",
                    "message": capture,
                    "steps": ["Find the timestamp prefix.", "Find Received: and Sent:.", "Compare Diversion on the two INVITEs."],
                    "check": check("Both debug blocks in this capture are", ["INVITE requests, one received and one sent", "OPTIONS with CSeq INVITE", "200 OK only", "REGISTER"], 0, "Each start line is INVITE. Directions differ.", "cube-basic")},
                fault={"title": "Profile did not touch the sent INVITE", "symptom": "After a remove rule was saved, the sent INVITE in debug ccsip messages still contains Diversion.",
                    "log": capture,
                    "choices": ["The profile did not modify the sent INVITE", "debug ccsip messages cannot display SIP", "Diversion is illegal and the debug invented it", "The timestamp is a SIP header"],
                    "answer": 0, "why": "Received and Sent both still include Diversion.", "cause": "The rule is not on the leg that produced the sent INVITE, or it does not match this message.", "fix": "Use debug ccsip feature sip-profiles for the profile decision, and retry the rule text in the Collaboration Solutions Analyzer SIP Profile Tester.", "cites": cites("cube-basic", "cube-prof", "cube-csa")},
            ),
        ],
    }


def track_multivendor():
    L = ADV
    server_in = msg_invite(ALICE, CUBE, CID_A, BR_A, TAG_A, extra=["Server: ExampleProxy/1.0"])
    server_out = msg_invite(CUBE, CARRIER, CID_B, BR_B, TAG_B, body=ANCHOR_SDP, contact_user="sbc")
    pai = msg_invite(CARRIER, CUBE, "pai-in-1@example.com", "z9hG4bKpai01", "paitag", body=CARRIER_SDP, contact_user="bob", contact_host=CARRIER, from_uri="sip:bob@example.com", from_name="Bob", extra=["P-Asserted-Identity: \"Bob\" <sip:+15551212@example.com>", "Privacy: id"])
    teams_name = msg_invite("sbc1.example.com", "sip.pstnhub.microsoft.com:5061", "cert-fqdn-1@sbc1.example.com", "z9hG4bKcert01", "certtag", body=SRTP_SDP, transport="TLS", contact_user="sbc", contact_host="sbc1.example.com")
    return {
        "id": "multivendor",
        "title": "Oracle, Ribbon, and AudioCodes",
        "summary": "Object names and manipulation syntax you can verify in public docs, and the certificate name the peer actually checks.",
        "level": L,
        "order": 11,
        "lessons": [
            lesson(L, id="oracle-objects", title="Oracle SBC objects", minutes=14, tags=["oracle", "realm", "hmr"],
                summary="Oracle Communications SBC, formerly Acme Packet, is configured with realms, interfaces, session agents, and manipulation objects.",
                objectives=["Name the objects the 10.1 docs use", "Attach a manipulation inbound or outbound", "Leave element-rule syntax in the configuration guide"],
                illustration={"type": "table", "title": "Objects you may name", "caption": "This is a vocabulary list from the documentation, not a command script.",
                    "columns": ["Object", "Role in the docs"],
                    "rows": [["realm", "Routing and policy context"], ["sip-interface", "SIP service address on a realm"], ["session-agent", "Named next hop"], ["sip-manipulation", "Named set of header rules"], ["in-manipulationid", "Manipulation on messages arriving"], ["out-manipulationid", "Manipulation on messages leaving"]]},
                sections=[
                    sec("Realm, interface, and next hop",
                        "Oracle Communications SBC was formerly Acme Packet. A realm is the routing and policy context, a sip-interface binds a SIP service address to a realm, and a session-agent is a named next hop.",
                        "In this synthetic the inside address is 203.0.113.10, the sip-interface address is 203.0.113.20, and the session-agent toward the carrier is 192.0.2.40. The product documentation, not this lesson, prints the configuration fields for those objects.",
                        "oracle-sbc", "oracle-hmr-cfg"),
                    sec("Where manipulation is attached",
                        "A sip-manipulation is a named set of header rules. In-manipulationid selects the manipulation for messages arriving on a sip-interface or session-agent, and out-manipulationid selects the manipulation for messages leaving.",
                        "An element-rule targets part of a header and lives under a header rule. Its field names are in the HMR configuration guide. This lesson names the object and does not invent the fields.",
                        "oracle-hmr", "oracle-hmr-cfg"),
                ],
                flow=flow("Two sides of one Oracle SBC", ["Phone", "SBC", "Carrier"], [
                    hop(0, 1, "INVITE", "req", "The request arrives on the inside sip-interface.", server_in),
                    hop(1, 0, "100", "res", "The SBC answers as the UAS.", msg_resp(100, "Trying", ALICE, BR_A, TAG_A, "", CID_A, "1 INVITE")),
                    hop(1, 2, "INVITE", "req", "The session-agent INVITE is a new request. Server was not copied.", server_out),
                    hop(2, 1, "100", "res", "The carrier sees only the outside dialog.", msg_resp(100, "Trying", CUBE, BR_B, TAG_B, "", CID_B, "1 INVITE")),
                ]),
                quiz=[
                    quiz_item("Oracle Communications SBC was formerly", ["Acme Packet", "A Ribbon SBC 1000 only", "CUCM", "A codec"], 0, "The docs still describe the Acme Packet lineage product.", "oracle-sbc"),
                    quiz_item("A session-agent is", ["A named next hop", "A SIP method", "An RTP payload", "A certificate extension"], 0, "The carrier at 192.0.2.40 would be represented as a session-agent.", "oracle-sbc"),
                    quiz_item("out-manipulationid selects", ["The manipulation applied to messages leaving", "The RTP port", "The realm’s DNS resolver only", "A reject status code"], 0, "in-manipulationid is the arrival direction.", "oracle-hmr-cfg"),
                    quiz_item("A sip-manipulation contains", ["Header rules", "Only SDP port numbers", "Dial-peer voice lines", "CUCM Lua menus"], 0, "header-rule objects live in that set.", "oracle-hmr"),
                    quiz_item("An element-rule", ["Targets part of a header, with fields defined in the HMR guide", "Is a Ribbon CLI command", "Sets a SIP status this lesson invents", "Replaces the realm"], 0, "Name it. Read the release guide for the syntax.", "oracle-hmr-cfg"),
                    quiz_item("A sip-interface is", ["The SIP service address bound to a realm", "The datasheet CPS formula", "An AudioCodes IP group", "A Teams FQDN"], 0, "It is where signaling is anchored for that realm.", "oracle-sbc"),
                ],
                cards=[
                    card("realm", "Routing and policy context on the Oracle SBC.", "oracle-sbc"),
                    card("session-agent", "Named next hop.", "oracle-sbc"),
                    card("in-manipulationid", "Which sip-manipulation runs on arrival.", "oracle-hmr-cfg"),
                    card("out-manipulationid", "Which sip-manipulation runs on the way out.", "oracle-hmr-cfg"),
                ],
                lab={"title": "Name the attachment", "kind": "config", "prompt": "These are documentation object names. Which one selects manipulation for messages leaving?",
                    "config": "realm\nsip-interface\nsession-agent\nsip-manipulation\nheader-rule\nelement-rule\nin-manipulationid\nout-manipulationid\n",
                    "steps": ["Read the list as vocabulary.", "Separate interface objects from manipulation objects.", "Pick the outbound attachment."],
                    "check": check("Messages leaving use", ["out-manipulationid", "in-manipulationid", "A CUBE dial peer", "An invented reject status"], 0, "out-manipulationid is the egress attachment.", "oracle-hmr-cfg")},
                fault={"title": "Server still present on the egress INVITE", "symptom": "A header rule was written to delete Server, and the carrier INVITE still contains Server: ExampleProxy/1.0.",
                    "log": msg_invite(CUBE, CARRIER, CID_B, BR_B, TAG_B, body=ANCHOR_SDP, contact_user="sbc", extra=["Server: ExampleProxy/1.0"]),
                    "choices": ["The manipulation is not referenced by out-manipulationid on the egress object", "RFC 3261 requires Server on every INVITE", "A realm cannot have a sip-interface", "element-rule deletes Call-ID automatically"],
                    "answer": 0, "why": "The egress request still shows the header.", "cause": "The sip-manipulation exists, but the leaving path does not reference it.", "fix": "Set out-manipulationid on the egress sip-interface or session-agent to the sip-manipulation that holds the header rule. Confirm the direction in the HMR configuration guide.", "cites": cites("oracle-hmr-cfg", "oracle-hmr")},
            ),
            lesson(L, id="acme-hmr", title="Header rules run in order", minutes=15, tags=["hmr", "oracle", "acme"],
                summary="Oracle HMR header rules run in configured order. The 10.1 fundamentals page names add, delete, manipulate, store, and reject.",
                objectives=["Put header rules in configured order", "Name the documented actions", "Leave the reject status code in the release guide"],
                illustration={"type": "states", "title": "Order is the feature", "caption": "A later rule sees the message earlier rules produced.",
                    "nodes": ["First rule", "Second rule", "store before delete", "Read the guide"]},
                sections=[
                    sec("Actions the fundamentals page names",
                        "The 10.1 HMR fundamentals page describes the actions add, delete, manipulate, and store. Reject also exists as an HMR action.",
                        "This lesson does not invent the SIP status code that reject sends. Read the release guide before you use reject. The lab uses delete, which removes the named header.",
                        "oracle-hmr", "oracle-hmr-cfg"),
                    sec("Configured order",
                        "Header rules run in configured order. If a store rule needs the Server value, that rule has to run before a delete rule on Server.",
                        "The teaching rule in the lab is a header-rule named strip-server. It sets header-name Server, action delete, comparison-type boolean, and msg-type any.",
                        "oracle-hmr"),
                ],
                flow=flow("Server removed on the way out", ["Phone", "SBC", "Carrier"], [
                    hop(0, 1, "INVITE", "req", "The inbound INVITE still has Server: ExampleProxy/1.0.", server_in),
                    hop(1, 0, "100", "res", "The UAS responds before the egress rules matter to the carrier.", msg_resp(100, "Trying", ALICE, BR_A, TAG_A, "", CID_A, "1 INVITE")),
                    hop(1, 2, "INVITE", "req", "After the delete rule, the carrier INVITE has no Server header.", server_out),
                    hop(2, 1, "180", "res", "The carrier response is a different message and a later rule set.", msg_resp(180, "Ringing", CUBE, BR_B, TAG_B, TAG_C, CID_B, "1 INVITE", extra=[f"Contact: <sip:bob@{CARRIER}>"])),
                ]),
                quiz=[
                    quiz_item("Header rules on the Oracle SBC run", ["In configured order", "In alphabetical header order only", "After the call ends", "Only on REGISTER"], 0, "A later rule sees earlier edits.", "oracle-hmr"),
                    quiz_item("add, delete, manipulate, and store are", ["Actions described on the 10.1 fundamentals page", "AudioCodes Action Type values", "CUBE dial-peer commands", "RTP directions"], 0, "reject is also an HMR action.", "oracle-hmr"),
                    quiz_item("The SIP status produced by reject", ["Is in the release guide, and is not invented here", "Is always 200 OK", "Is always 180", "Is carried in the branch cookie"], 0, "Read the guide for the code.", "oracle-hmr"),
                    quiz_item("action delete on header-name Server", ["Removes the Server header", "Adds Server", "Stores the SDP port", "Changes Call-ID"], 0, "That is the lab rule strip-server.", "oracle-hmr-cfg"),
                    quiz_item("msg-type any means the teaching rule is considered for", ["Requests and responses", "INVITE only, by RFC 3261", "ACK only", "No messages"], 0, "The fundamentals page is still the source for production policy.", "oracle-hmr"),
                    quiz_item("A store of Server must be placed", ["Before the delete of Server", "After the delete", "Inside SDP", "On the CUCM trunk"], 0, "Order decides whether the value still exists.", "oracle-hmr"),
                ],
                cards=[
                    card("header-rule", "One rule inside a sip-manipulation.", "oracle-hmr-cfg"),
                    card("delete", "Removes the named header. Lab rule strip-server.", "oracle-hmr"),
                    card("store", "Keeps a value for a later rule. Run it first.", "oracle-hmr"),
                    card("reject", "An HMR action. Read the release guide for the status.", "oracle-hmr"),
                ],
                lab={"title": "Delete Server", "kind": "sandbox", "dialect": "acme", "prompt": "Run this Acme header-rule subset against the INVITE. Server should disappear.",
                    "rules": ACME_RULE,
                    "message": server_in,
                    "steps": ["Read header-name and action.", "Run the rule.", "Confirm Server is gone."],
                    "check": check("action delete on Server", ["Removes the Server header", "Adds a second Server header", "Rewrites the SDP codec", "Sends a status code this lab invents"], 0, "comparison-type boolean and msg-type any select the header for deletion.", "oracle-hmr")},
                fault={"title": "store ran after delete", "symptom": "A later rule that stores Server records an empty result. The delete rule is configured first.",
                    "log": "header-rule\nname drop-server\nheader-name Server\naction delete\nheader-rule\nname keep-server\nheader-name Server\naction store\n",
                    "choices": ["The store rule is after the delete, so the header is already gone", "store is not a documented action", "delete always runs last regardless of configuration", "msg-type any skips INVITE"],
                    "answer": 0, "why": "Header rules run in configured order.", "cause": "keep-server is ordered after drop-server.", "fix": "Configure the store rule before the delete rule. Confirm the order in the 10.1 HMR configuration guide.", "cites": cites("oracle-hmr", "oracle-hmr-cfg")},
            ),
            lesson(L, id="ribbon-families", title="Ribbon Edge, Core, and public validation lists", minutes=13, tags=["ribbon", "edge", "core"],
                summary="SBC SWe Edge shares a software family with SBC 1000 and SBC 2000. SBC Core is a separate family. Admin guides and interop guides are the sources for procedures.",
                objectives=["Separate Edge from Core", "Read the ACS validation list as a snapshot", "Use the documentation portal instead of invented CLI"],
                illustration={"type": "table", "title": "What each public source is for", "caption": "The ACS list is not a price list.",
                    "columns": ["Source", "What it supports saying"],
                    "rows": [["SBC Edge product page", "SWe Edge, and the family that includes SBC 1000 and SBC 2000"], ["Separate family", "SBC Core"], ["ACS validation document", "SBC 5110, 5210, 5400, 7000, and SBC SWe for that test"], ["Documentation portal", "Admin guides"], ["Interop guides", "Peer-specific notes"]]},
                sections=[
                    sec("Two families",
                        "The SBC Edge product page describes SBC SWe Edge and says the same software family includes SBC 1000 and SBC 2000. SBC Core is a separate family.",
                        "This lesson does not invent Ribbon CLI. Procedures belong in the admin guide on the documentation portal, and peer notes belong in the interoperability guides.",
                        "ribbon-edge", "ribbon-docs", "ribbon-iot"),
                    sec("A validation list is not a catalog",
                        "A public Ribbon document about Azure Communication Services names support on SBC 5110, SBC 5210, SBC 5400, SBC 7000, and SBC SWe for that validation. Those model numbers belong to that validation, not to a price list.",
                        "That list is a validation snapshot. It is not the full current price list and it is not a complete product catalog. Do not treat those model numbers as every SKU Ribbon sells.",
                        "ribbon-docs", "ribbon-edge"),
                ],
                flow=eight("SIP still looks like SIP on either family", [
                    "The phone sends a normal INVITE. The family name is not a SIP method.",
                    "100 Trying comes from the SBC in the lab.",
                    "The SBC opens the carrier leg.",
                    "180 Ringing returns.",
                    "The caller leg is notified.",
                    "200 OK carries the answer.",
                    "The caller receives 200 OK.",
                    "ACK completes the dialog. Configuration commands are not in the SIP.",
                ]),
                quiz=[
                    quiz_item("SBC 1000 and SBC 2000 belong with", ["The SBC Edge software family that includes SBC SWe Edge", "A CUBE dial peer", "Oracle header rules", "Teams Direct Routing proxies"], 0, "That is what the Edge product page says.", "ribbon-edge"),
                    quiz_item("SBC Core is", ["A separate family from SBC Edge", "The same software image as SBC 1000 by definition", "An AudioCodes manipulation set", "A SIP method"], 0, "Do not copy procedures from one family onto the other.", "ribbon-edge"),
                    quiz_item("The ACS document’s model list is", ["A validation snapshot, not a price list", "The complete current catalog", "An RFC", "A CUCM menu"], 0, "It names 5110, 5210, 5400, 7000, and SBC SWe for that test.", "ribbon-docs"),
                    quiz_item("Admin procedures are found", ["Behind the Ribbon documentation portal", "In an invented CLI in this lesson", "In RFC 7092", "In the SDP fmtp line"], 0, "This course does not invent Ribbon CLI.", "ribbon-docs"),
                    quiz_item("Peer-specific Ribbon notes are published as", ["Interoperability guides", "CUBE voice class sip-profiles", "Oracle element-rule field lists", "RFC 5853"], 0, "Use ribbon-iot for those guides.", "ribbon-iot"),
                    quiz_item("SBC 5110 appears here as", ["A model named in that ACS validation", "The universal Edge replacement for SBC 1000", "A SIP response code", "A codec"], 0, "Do not promote the validation list into a catalog.", "ribbon-docs"),
                ],
                cards=[
                    card("SWe Edge", "Edge product. Family includes SBC 1000 and SBC 2000.", "ribbon-edge"),
                    card("SBC Core", "A separate family.", "ribbon-edge"),
                    card("ACS snapshot", "5110, 5210, 5400, 7000, and SWe for that validation.", "ribbon-docs"),
                    card("No invented CLI", "Admin guides live on the documentation portal.", "ribbon-docs"),
                ],
                lab={"title": "Keep the families apart", "kind": "ladder", "prompt": "Play the call. Which SIP method names the Ribbon family?",
                    "steps": ["Play the ladder.", "Read the methods.", "Notice the family is a product fact, not a method."],
                    "check": check("The ladder’s request methods are", ["INVITE and ACK", "EDGE and CORE", "RIBBON and INVITE", "HMR and OPTIONS"], 0, "Product family is chosen in the admin guide, not in the start line.", "3261")},
                fault={"title": "One procedure applied to two families", "symptom": "A change written for an Edge box was repeated unchanged on a Core box. The peer then stopped answering OPTIONS.",
                    "log": "OPTIONS sip:192.0.2.40 SIP/2.0\nVia: SIP/2.0/UDP 203.0.113.20;branch=z9hG4bKoptkeep01\nCSeq: 1 OPTIONS\nCall-ID: opt-keep-1@example.com\n(no response)\n",
                    "choices": ["Edge and Core are different families and this course has no shared CLI", "OPTIONS is illegal on Ribbon", "RFC 5853 defines one CLI for both", "A missing 180 proves the certificate"],
                    "answer": 0, "why": "The probe is ordinary SIP. The broken part is the assumption that one family’s procedure is the other’s.", "cause": "Configuration was copied across families.", "fix": "Open the admin guide on the documentation portal for the product you are touching, and the interoperability guide for that peer.", "cites": cites("ribbon-docs", "ribbon-iot", "ribbon-edge")},
            ),
            lesson(L, id="audiocodes-rules", title="AudioCodes manipulation in software 7.6", minutes=14, tags=["audiocodes", "manipulation"],
                summary="Software 7.6 message manipulation is a table of Message Type, Condition, Action Subject, Action Type, and Action Value, assigned to an IP group.",
                objectives=["Name the five table fields", "Name the documented action types", "Treat the menu as release-specific"],
                illustration={"type": "table", "title": "7.6 manipulation columns", "caption": "The menu that opens this table changes by release.",
                    "columns": ["Field", "Lab value"],
                    "rows": [["Message Type", "INVITE"], ["Condition", "See the syntax guide"], ["Action Subject", "Server"], ["Action Type", "Remove"], ["Action Value", "Empty for Remove"]]},
                sections=[
                    sec("The table",
                        "AudioCodes Mediant message manipulation in software 7.6 uses the fields Message Type, Condition, Action Subject, Action Type, and Action Value. Each rule is one row in that table.",
                        "Action types include Add, Remove, Modify, Add Prefix, Add Suffix, Remove Prefix, Remove Suffix, and Normalize. The syntax guide defines the values. This lesson does not invent a normalization grammar.",
                        "audiocodes", "audiocodes-syntax"),
                    sec("Where the set is attached",
                        "A manipulation set is assigned to an IP group inbound or outbound. The direction decides which messages the set sees.",
                        "The on-screen menu is release-specific. Open the 7.6 manual for the software you are running instead of memorizing a click-path from a different release.",
                        "audiocodes"),
                ],
                flow=flow("Remove Server toward the carrier", ["Phone", "Mediant", "Carrier"], [
                    hop(0, 1, "INVITE", "req", "Server is still present on the inbound INVITE.", server_in),
                    hop(1, 0, "100", "res", "The Mediant accepts the dialog.", msg_resp(100, "Trying", ALICE, BR_A, TAG_A, "", CID_A, "1 INVITE")),
                    hop(1, 2, "INVITE", "req", "An outbound Remove on subject Server produces this INVITE.", server_out),
                    hop(2, 1, "100", "res", "The carrier transaction continues.", msg_resp(100, "Trying", CUBE, BR_B, TAG_B, "", CID_B, "1 INVITE")),
                ]),
                quiz=[
                    quiz_item("Software 7.6 manipulation fields include", ["Message Type, Condition, Action Subject, Action Type, Action Value", "Only a CUBE sip-header line", "realm and session-agent", "dial-peer voice N voip"], 0, "Those five names are the table.", "audiocodes"),
                    quiz_item("Remove is", ["An Action Type", "A Message Type only", "An RTP codec", "A Ribbon family"], 0, "Add, Modify, and the prefix and suffix actions are Action Types too.", "audiocodes-syntax"),
                    quiz_item("Normalize is", ["An Action Type whose value format is in the syntax guide", "A SIP method", "A CUCM trunk setting", "Forbidden in 7.6"], 0, "Do not invent the grammar.", "audiocodes-syntax"),
                    quiz_item("The manipulation set is assigned to", ["An IP group, inbound or outbound", "A DNS NAPTR record only", "The SDP v= line", "A Teams wildcard certificate"], 0, "Direction is part of the assignment.", "audiocodes"),
                    quiz_item("The menu location is", ["Release-specific", "Identical in every AudioCodes PDF ever published", "Defined by RFC 7092", "The same as voice class sip-profiles"], 0, "Open the manual for the software you run.", "audiocodes"),
                    quiz_item("Add Prefix and Remove Suffix are", ["Action types in the 7.6 list", "Oracle HMR actions", "CUBE debug commands", "Response codes"], 0, "They edit the action subject using the syntax guide’s value.", "audiocodes-syntax"),
                ],
                cards=[
                    card("Action Subject", "Which header or element the rule touches.", "audiocodes"),
                    card("Action Type", "Add, Remove, Modify, prefix, suffix, or Normalize.", "audiocodes-syntax"),
                    card("IP group", "Inbound or outbound assignment of the set.", "audiocodes"),
                    card("Release menu", "The clicks change. Use the 7.6 manual you are running.", "audiocodes"),
                ],
                lab={"title": "Read one 7.6 row", "kind": "config", "prompt": "Which column contains Remove?",
                    "config": "Message Type: INVITE\nCondition: see the 7.6 syntax guide\nAction Subject: Server\nAction Type: Remove\nAction Value:\n",
                    "steps": ["Find Action Type.", "Find Action Subject.", "Leave Condition’s grammar in the syntax guide."],
                    "check": check("Remove is written in", ["Action Type", "Message Type", "The SDP c= line", "Call-ID"], 0, "Server is the Action Subject.", "audiocodes")},
                fault={"title": "Outbound set, inbound header", "symptom": "Server still arrives from the carrier and is forwarded inward. The manipulation set is assigned outbound only.",
                    "log": msg_resp(200, "OK", CUBE, BR_B, TAG_B, TAG_C, CID_B, "1 INVITE", extra=["Server: ExampleProxy/1.0", f"Contact: <sip:bob@{CARRIER}>"], body=CARRIER_SDP),
                    "choices": ["The set is bound to the IP group in the outbound direction, and this Server header is inbound", "Remove is not an Action Type in 7.6", "Message Type INVITE cannot match a response, so the table has no message field", "RFC 3261 forbids Action Subject"],
                    "answer": 0, "why": "The 200 OK is arriving from the carrier, which is the inbound direction on that IP group.", "cause": "The manipulation set was assigned outbound.", "fix": "Assign the set inbound on that IP group if the header to remove is the one arriving. Confirm the menu in the 7.6 manual for this release.", "cites": cites("audiocodes", "audiocodes-syntax")},
            ),
            lesson(L, id="compare-manipulation", title="Three manipulation grammars", minutes=14, tags=["compare", "manipulation"],
                summary="CUBE, Oracle HMR, and AudioCodes 7.6 can each remove a header. The grammars are not interchangeable.",
                objectives=["Match a snippet to its product", "Keep rule order in mind on each product", "Stop pasting one syntax into another box"],
                illustration={"type": "table", "title": "Same job, three texts", "caption": "Removing Server or Diversion is the job. The text is product-specific.",
                    "columns": ["Product", "Text you can defend", "Order"],
                    "rows": [["CUBE", "request INVITE sip-header Diversion remove", "Rules in the profile, as written"], ["Oracle", "header-rule action delete", "Configured header-rule order"], ["AudioCodes 7.6", "Action Type Remove", "The set on the IP group direction"]]},
                sections=[
                    sec("What is safe to copy from this course",
                        "On CUBE the defended line is request INVITE sip-header Diversion remove inside voice class sip-profiles. On Oracle the defended block is a header-rule with action delete.",
                        "On AudioCodes software 7.6 the defended row uses Action Type Remove and an Action Subject. Pasting the CUBE line into an Oracle header-rule does not configure either product.",
                        "cube-prof", "oracle-hmr", "audiocodes"),
                    sec("Order and direction",
                        "CUBE applies the profile rules on the leg where that profile is attached. Oracle header rules run in configured order. AudioCodes uses the manipulation set assigned inbound or outbound on the IP group.",
                        "When a header survives, check those three attachments before inventing a fourth syntax. Ribbon procedures stay in the Ribbon admin guide and are not given a CLI here.",
                        "oracle-hmr-cfg", "ribbon-docs"),
                ],
                flow=flow("One header, removed only by the grammar that is loaded", ["Phone", "SBC", "Carrier"], [
                    hop(0, 1, "INVITE", "req", "Diversion and Server are both still present.", msg_invite(ALICE, CUBE, CID_A, BR_A, TAG_A, extra=["Diversion: <sip:+15551212@example.com>;reason=unconditional", "Server: ExampleProxy/1.0"])),
                    hop(1, 0, "100", "res", "The inbound transaction is accepted.", msg_resp(100, "Trying", ALICE, BR_A, TAG_A, "", CID_A, "1 INVITE")),
                    hop(1, 2, "INVITE", "req", "A successful egress rule set produced an INVITE without those two headers.", server_out),
                    hop(2, 1, "100", "res", "The carrier sees the edited request.", msg_resp(100, "Trying", CUBE, BR_B, TAG_B, "", CID_B, "1 INVITE")),
                ]),
                quiz=[
                    quiz_item("request INVITE sip-header Diversion remove is", ["CUBE voice class sip-profiles syntax", "An Oracle header-rule", "An AudioCodes Action Value", "A Ribbon CLI line"], 0, "It belongs on IOS XE.", "cube-prof"),
                    quiz_item("action delete belongs to", ["An Oracle header-rule", "A CUBE dial peer", "An AudioCodes Message Type", "debug ccsip messages"], 0, "The header-name line names the header.", "oracle-hmr"),
                    quiz_item("Action Type Remove belongs to", ["AudioCodes 7.6", "RFC 3261", "A CUCM Lua menu this course invents", "The Teams OPTIONS table"], 0, "It is one cell in the manipulation table.", "audiocodes"),
                    quiz_item("Oracle rule order is", ["The configured header-rule order", "Always alphabetical", "Random", "Defined by Max-Forwards"], 0, "Earlier rules feed later rules.", "oracle-hmr"),
                    quiz_item("Pasting a CUBE profile line into Oracle", ["Does not configure the header-rule", "Is the documented migration", "Sets reject to 200", "Creates a realm"], 0, "Use the grammar the box actually parses.", "oracle-hmr-cfg"),
                    quiz_item("Ribbon’s absence from the syntax table means", ["This course does not invent Ribbon CLI", "Ribbon cannot manipulate headers", "Ribbon uses voice class sip-profiles", "Ribbon is an AudioCodes Action Type"], 0, "Use the admin guide and the interop guide.", "ribbon-docs"),
                ],
                cards=[
                    card("CUBE line", "request INVITE sip-header NAME remove.", "cube-prof"),
                    card("Oracle block", "header-rule, header-name, action delete.", "oracle-hmr"),
                    card("AudioCodes row", "Action Type Remove on an IP group.", "audiocodes"),
                    card("Do not paste across", "Each grammar is parsed by its own product.", "oracle-hmr-cfg"),
                ],
                lab={"title": "Identify the row", "kind": "config", "prompt": "Three fragments are printed. Which one is the AudioCodes 7.6 action?",
                    "config": "request INVITE sip-header Diversion remove\n\nheader-rule\nname strip-server\nheader-name Server\naction delete\n\nAction Type: Remove\nAction Subject: Server\n",
                    "steps": ["Find the CUBE line.", "Find the Oracle block.", "Find Action Type."],
                    "check": check("Action Type: Remove is", ["AudioCodes 7.6", "CUBE", "Oracle HMR", "A SIP method"], 0, "The CUBE line starts with request INVITE. The Oracle block starts with header-rule.", "audiocodes")},
                fault={"title": "CUBE syntax on an Oracle box", "symptom": "The Oracle configuration was saved with a CUBE profile line where a header-rule was required. Server is unchanged.",
                    "log": "request INVITE sip-header Server remove\nINVITE sip:+15551212@192.0.2.40 SIP/2.0\nServer: ExampleProxy/1.0\n",
                    "choices": ["The loaded text is CUBE syntax, so the Oracle rule never ran", "action delete is illegal on Server", "RFC 3261 reinserts Server", "AudioCodes Normalize runs on Oracle automatically"],
                    "answer": 0, "why": "The configuration text is a sip-header line, not a header-rule.", "cause": "A CUBE snippet was pasted into the Oracle manipulation.", "fix": "Replace it with a header-rule whose action is delete and whose header-name is Server. Keep the CUBE line on CUBE.", "cites": cites("oracle-hmr", "cube-prof")},
            ),
            lesson(L, id="pai-interop", title="Identity at a trust boundary", minutes=14, tags=["pai", "privacy", "diversion"],
                summary="P-Asserted-Identity is a network-asserted identity. An SBC at a trust boundary decides whether that assertion continues.",
                objectives=["Read P-Asserted-Identity and Privacy", "Strip an assertion that arrives from an untrusted peer", "Use the interop guide for header mapping"],
                illustration={"type": "layers", "title": "Trust boundary", "caption": "Add an assertion only for a peer you are willing to tell the identity to.",
                    "layers": [{"name": "Untrusted ingress", "detail": "Carrier INVITE may contain PAI"}, {"name": "SBC policy", "detail": "Strip or replace the assertion"}, {"name": "Trusted egress", "detail": "Assert only an identity you authenticated"}]},
                sections=[
                    sec("What arrived",
                        "RFC 3325 defines P-Asserted-Identity as an identity asserted by a network element. The synthetic carrier INVITE asserts sip:+15551212@example.com and sets Privacy: id, which asks downstream elements to withhold that identity.",
                        "An untrusted peer can put any URI in that header. Forwarding it onto the enterprise leg treats the carrier’s assertion as your own. The defensive action is to remove or replace it on ingress.",
                        "3325", "3323"),
                    sec("Mapping is an interop problem",
                        "Diversion and History-Info are different redirecting headers. If one side sends Diversion and the other accepts History-Info, the mapping belongs in the interop guide for that pair.",
                        "CUBE profiles, Oracle header rules, and AudioCodes manipulation sets are the tools. Ribbon peer notes are in the interoperability guides. This lesson does not invent a Ribbon command or a universal translation formula.",
                        "5806", "7044", "ribbon-iot"),
                ],
                flow=flow("PAI arrives from the carrier", ["Carrier", "SBC", "CUCM"], [
                    hop(0, 1, "INVITE", "req", "The untrusted INVITE carries P-Asserted-Identity and Privacy: id.", pai),
                    hop(1, 0, "100", "res", "The SBC accepts the dialog without yet vouching for the identity.", msg_resp(100, "Trying", CARRIER, "z9hG4bKpai01", "paitag", "", "pai-in-1@example.com", "1 INVITE", from_uri="sip:bob@example.com", from_name="Bob")),
                    hop(1, 2, "INVITE", "req", "The trusted leg in this synthetic does not copy the carrier assertion.", msg_invite(CUBE, CUCM, CID_B, BR_B, TAG_B, body=ANCHOR_SDP, contact_user="sbc")),
                    hop(2, 1, "100", "res", "CUCM answers the new dialog.", msg_resp(100, "Trying", CUBE, BR_B, TAG_B, "", CID_B, "1 INVITE")),
                ]),
                quiz=[
                    quiz_item("P-Asserted-Identity is defined by", ["RFC 3325", "RFC 4733", "RFC 3550", "The AudioCodes menu"], 0, "It is a network-asserted identity.", "3325"),
                    quiz_item("Privacy: id asks the network to", ["Withhold the asserted identity from untrusted parties", "Anchor RTP", "Force early offer", "Delete Call-ID"], 0, "RFC 3323 defines the Privacy header.", "3323"),
                    quiz_item("PAI from an untrusted carrier should be", ["Removed or replaced before it is treated as your assertion", "Copied onto every internal trunk", "Written into SDP c=", "Used as the Via branch"], 0, "The carrier did not authenticate the caller for you.", "3325"),
                    quiz_item("Adding PAI toward a peer is appropriate when", ["That peer is inside the trust you configured and you authenticated the identity", "The peer sent Privacy: id", "You want a shorter Call-ID", "The datasheet is unread"], 0, "Assertion is a trust decision.", "3325"),
                    quiz_item("Diversion and History-Info", ["Are different headers, mapped per the interop guide", "Are the same header", "Are RTP payloads", "Are Ribbon CLI verbs"], 0, "RFC 5806 and RFC 7044.", "5806"),
                    quiz_item("A Ribbon peer’s header requirements are in", ["The interoperability guides", "An invented CLI in this lesson", "RFC 5853’s method list", "voice class sip-profiles on Ribbon"], 0, "Do not invent the command.", "ribbon-iot"),
                ],
                cards=[
                    card("PAI", "P-Asserted-Identity, RFC 3325.", "3325"),
                    card("Privacy", "RFC 3323. id asks the network to withhold identity.", "3323"),
                    card("Diversion", "RFC 5806 redirecting header.", "5806"),
                    card("History-Info", "RFC 7044. Map it only as the interop guide says.", "7044"),
                ],
                lab={"title": "Find the assertion", "kind": "dissect", "prompt": "Dissect the carrier INVITE. Which header asserts the identity?",
                    "message": pai,
                    "check": check("The asserted identity header is", ["P-Asserted-Identity", "Via", "Content-Length", "Allow"], 0, "Privacy: id is also present.", "3325")},
                fault={"title": "Untrusted PAI forwarded", "symptom": "CUCM receives P-Asserted-Identity copied from the carrier INVITE. The carrier is not inside the trust boundary.",
                    "log": msg_invite(CUBE, CUCM, CID_B, BR_B, TAG_B, body=ANCHOR_SDP, contact_user="sbc", extra=["P-Asserted-Identity: \"Bob\" <sip:+15551212@example.com>"]),
                    "choices": ["The ingress policy forwarded an assertion the SBC did not make", "RFC 3325 requires every B2BUA to copy PAI", "Privacy: id means copy the header", "The SDP c= line is the identity"],
                    "answer": 0, "why": "The outbound INVITE still contains the carrier’s P-Asserted-Identity.", "cause": "No ingress manipulation removed the untrusted assertion.", "fix": "Delete or replace P-Asserted-Identity on the untrusted ingress with the manipulation tool for that SBC. Assert an identity on the way out only when the peer is trusted and you authenticated the caller.", "cites": cites("3325", "3323")},
            ),
            lesson(L, id="certificate-fqdn", title="Certificate names and Contact", minutes=14, tags=["certificate", "fqdn", "tls"],
                summary="The certificate name and the SIP Contact need to be names the peer accepts. Teams and Webex Local Gateway do not share a wildcard rule.",
                objectives=["Match a certificate name to the SIP name", "Use an FQDN in a Teams Contact", "Keep Webex Local Gateway off wildcard certificates"],
                illustration={"type": "table", "title": "Wildcard certificates", "caption": "The same file can be acceptable to one peer and rejected by another.",
                    "columns": ["Peer", "Wildcard in CN or SAN", "Contact"],
                    "rows": [["Teams Direct Routing", "Supported", "FQDN, or the proxy returns 403"], ["Webex Local Gateway", "Not supported", "Certificate-based trunk for a third-party SBC"], ["Generic TLS peer", "Read RFC 5922 and that peer’s guide", "The name the peer expects"]]},
                sections=[
                    sec("Names, not a guess",
                        "RFC 5922 describes domain certificates for SIP. The name in the certificate is the name the peer checks, and the SIP Contact on a TLS trunk should be the name that peer expects.",
                        "The synthetic Teams INVITE uses Contact sip:sbc@sbc1.example.com and Via host sbc1.example.com. The signaling port for Direct Routing is 5061 toward sip.pstnhub.microsoft.com.",
                        "5922", "teams-sip", "teams-plan"),
                    sec("Two documented wildcard rules",
                        "Microsoft says wildcard names in the certificate CN or SAN are supported for Direct Routing. A Contact that is an IP address, such as 203.0.113.20, is not that pattern: the proxy returns 403.",
                        "The Webex Local Gateway get-started article says wildcard certificates are not supported for Local Gateway. A certificate that Teams accepts can still be the wrong certificate for a Webex Local Gateway.",
                        "teams-plan", "webex-lgw"),
                ],
                flow=flow("TLS INVITE with an FQDN Contact", ["SBC", "Teams proxy"], [
                    hop(0, 1, "INVITE", "req", "Contact is sip:sbc@sbc1.example.com. The Request-URI host is sip.pstnhub.microsoft.com.", teams_name),
                    hop(1, 0, "100", "res", "A provisional response copies the Via, including the FQDN.", msg_resp(100, "Trying", "sbc1.example.com", "z9hG4bKcert01", "certtag", "", "cert-fqdn-1@sbc1.example.com", "1 INVITE", transport="TLS")),
                    hop(1, 0, "180", "res", "Alerting still addresses the FQDN Contact’s dialog.", msg_resp(180, "Ringing", "sbc1.example.com", "z9hG4bKcert01", "certtag", "teamstag", "cert-fqdn-1@sbc1.example.com", "1 INVITE", transport="TLS", extra=["Contact: <sip:sip.pstnhub.microsoft.com:5061;transport=tls>"])),
                    hop(1, 0, "200", "res", "The answer SDP uses SRTP on the SBC media address.", msg_resp(200, "OK", "sbc1.example.com", "z9hG4bKcert01", "certtag", "teamstag", "cert-fqdn-1@sbc1.example.com", "1 INVITE", transport="TLS", extra=["Contact: <sip:sip.pstnhub.microsoft.com:5061;transport=tls>"], body=SRTP_SDP)),
                ]),
                quiz=[
                    quiz_item("RFC 5922 is about", ["Domain certificates for SIP", "DTMF events", "B2BUA taxonomy", "Call admission formulas"], 0, "The certificate identity is a domain name question.", "5922"),
                    quiz_item("A Teams Contact that is an IP address", ["Gets 403 from the proxy", "Is required", "Selects the media bypass datasheet", "Disables TLS"], 0, "The Contact must be an FQDN.", "teams-sip"),
                    quiz_item("Wildcard names in the certificate CN or SAN for Direct Routing are", ["Supported", "Forbidden by the plan document", "The same rule as Webex Local Gateway", "Carried in Max-Forwards"], 0, "Microsoft documents wildcard support for Direct Routing.", "teams-plan"),
                    quiz_item("Wildcard certificates for a Webex Local Gateway are", ["Not supported", "Required", "Defined by RFC 4733", "The same as a Teams wildcard"], 0, "The get-started article says they are not supported.", "webex-lgw"),
                    quiz_item("The Direct Routing signaling port in this lesson is", ["5061", "5060 only", "443 only", "The RTP port in SDP"], 0, "The INVITE targets sip.pstnhub.microsoft.com on 5061.", "teams-sip"),
                    quiz_item("sbc1.example.com in the lab Contact is", ["The FQDN the certificate name should agree with", "An IP address", "A CUCM Lua script", "An onmicrosoft.com domain"], 0, "The proxy is checking a name.", "5922"),
                ],
                cards=[
                    card("RFC 5922", "SIP domain certificates.", "5922"),
                    card("Teams Contact", "FQDN. An IP draws 403.", "teams-sip"),
                    card("Teams wildcard", "CN or SAN wildcards are supported for Direct Routing.", "teams-plan"),
                    card("Webex LGW wildcard", "Not supported for Local Gateway.", "webex-lgw"),
                ],
                lab={"title": "Read the Teams Contact", "kind": "dissect", "prompt": "Dissect the TLS INVITE. Is Contact an FQDN or an IP?",
                    "message": teams_name,
                    "check": check("Contact host is", ["sbc1.example.com", "203.0.113.20", "198.51.100.30", "Missing"], 0, "The FQDN is what Direct Routing will accept.", "teams-sip")},
                fault={"title": "403 on an IP Contact", "symptom": "Direct Routing returns 403. The INVITE is TLS to port 5061, and Contact uses 203.0.113.20.",
                    "log": "SIP/2.0 403 Forbidden\nCSeq: 1 INVITE\nCall-ID: cert-fqdn-1@sbc1.example.com\nINVITE had Contact: <sip:sbc@203.0.113.20>\n",
                    "choices": ["Contact is an IP address, and the proxy requires an FQDN", "TLS 1.2 is forbidden for Direct Routing", "A wildcard is required on Webex and Teams equally", "503 would be the documented Contact failure"],
                    "answer": 0, "why": "The plan and protocol articles require a name in Contact.", "cause": "The Contact host is 203.0.113.20.", "fix": "Use Contact sip:sbc@sbc1.example.com, with that name in the certificate. Keep wildcard rules separate: supported for Direct Routing, not supported for a Webex Local Gateway.", "cites": cites("teams-sip", "teams-plan", "webex-lgw")},
            ),
        ],
    }


def track_cloud():
    L = ADV
    teams_inv = msg_invite("sbc1.example.com", "sip.pstnhub.microsoft.com:5061", "teams-call-1@sbc1.example.com", "z9hG4bKteams01", "teamstag", body=SRTP_SDP, transport="TLS", contact_user="sbc", contact_host="sbc1.example.com")
    teams_opt = msg_options("sbc1.example.com", "sip.pstnhub.microsoft.com", BR_T, "opt-teams-1@sbc1.example.com", "teamsopt", transport="TLS", contact_host="sbc1.example.com", port=5061)
    teams_ok = msg_options_ok("sbc1.example.com", BR_T, "teamsopt", "sip.pstnhub.microsoft.com", "opt-teams-1@sbc1.example.com", transport="TLS", from_host="sbc1.example.com", contact="<sip:sip.pstnhub.microsoft.com:5061;transport=tls>")
    webex_inv = msg_invite(CUBE, CARRIER, "webex-lgw-1@example.com", "z9hG4bKwebex1", "wxgtag", body=SRTP_SDP, transport="TLS", contact_user="sbc", contact_host="sbc1.example.com")
    lgw_pstn = msg_invite(CUBE, CARRIER, "byopstn-1@example.com", "z9hG4bKbyo01", "byotag", body=ANCHOR_SDP, contact_user="sbc", contact_host="sbc1.example.com")
    siprec = msg_invite(CUBE, CUCM, "siprec-1@example.com", "z9hG4bKsiprec1", "rectag", body=ANCHOR_SDP, contact_user="recorder", contact_host=CUBE)
    twilio_ok = msg_invite(CUBE, "sbc1.example.com", "twilio-term-1@example.com", "z9hG4bKtwilio1", "twtag", body=ANCHOR_SDP, contact_user="sbc", contact_host="sbc1.example.com")
    genesys_inv = msg_invite(CUBE, CARRIER, "byoc-1@example.com", "z9hG4bKbyoc01", "byoctag", body=ANCHOR_SDP, contact_user="sbc", contact_host="sbc1.example.com")
    bad_options = """OPTIONS sip:sip.pstnhub.microsoft.com:5061 SIP/2.0
Via: SIP/2.0/TLS sbc1.example.com;branch=z9hG4bKoptbad1
Max-Forwards: 70
From: <sip:sbc@sbc1.example.com>;tag=badopt
To: <sip:sip.pstnhub.microsoft.com>
Call-ID: opt-bad-1@sbc1.example.com
CSeq: 1 INVITE
Contact: <sip:sbc@sbc1.example.com>
Content-Length: 0
"""
    return {
        "id": "cloud",
        "title": "Cloud voice and CCaaS SIP",
        "summary": "Documented SIP boundaries for Teams, Webex Calling, Amazon Connect, Five9, Twilio, Genesys, and NICE CXone.",
        "level": L,
        "order": 12,
        "lessons": [
            lesson(L, id="teams-signaling", title="Teams Direct Routing signaling", minutes=16, tags=["teams", "direct-routing", "tls"],
                summary="Direct Routing uses the pstnhub proxies on 5061, a certified SBC, and a verified domain. Contact must be an FQDN.",
                objectives=["Name the three signaling FQDNs and port 5061", "Require a verified domain and an FQDN Contact", "Remember that connection aliasing is unsupported"],
                illustration={"type": "table", "title": "Direct Routing signaling", "caption": "Checked against the plan and protocol articles.",
                    "columns": ["Item", "Documented value"],
                    "rows": [["Proxies", "sip, sip2, and sip3.pstnhub.microsoft.com"], ["Port", "5061"], ["TLS", "1.2 or later"], ["Contact", "FQDN, or the proxy returns 403"], ["Domain", "Verified tenant domain"], ["RFC 5923", "Not supported by the SIP proxy"]]},
                sections=[
                    sec("Where the SBC sends signaling",
                        "Direct Routing signaling uses sip.pstnhub.microsoft.com, sip2.pstnhub.microsoft.com, and sip3.pstnhub.microsoft.com on port 5061. TLS 1.2 or later is required, and the SBC is a certified SBC.",
                        "The synthetic INVITE targets sip.pstnhub.microsoft.com:5061 from sbc1.example.com. The real routing among the three proxies is in the plan and protocol articles.",
                        "teams-plan", "teams-sip", "teams-rfc"),
                    sec("Names the proxy will accept",
                        "The Contact must be an FQDN. If Contact is an IP address the proxy returns 403. The domain on the trunk must be a verified tenant domain, not a name ending in onmicrosoft.com.",
                        "The protocols article says the SIP proxy does not support RFC 5923 connection aliasing. Microsoft says wildcard names in the certificate CN or SAN are supported for Direct Routing.",
                        "teams-plan", "teams-rfc", "5923"),
                ],
                flow=flow("INVITE to the primary proxy", ["SBC", "sip.pstnhub.microsoft.com"], [
                    hop(0, 1, "INVITE", "req", "Contact is sip:sbc@sbc1.example.com. Media in this offer is RTP/SAVP.", teams_inv),
                    hop(1, 0, "100", "res", "The proxy has the transaction. 100 does not mean the SBC is healthy.", msg_resp(100, "Trying", "sbc1.example.com", "z9hG4bKteams01", "teamstag", "", "teams-call-1@sbc1.example.com", "1 INVITE", transport="TLS")),
                    hop(1, 0, "180", "res", "Alerting comes back on the same Via.", msg_resp(180, "Ringing", "sbc1.example.com", "z9hG4bKteams01", "teamstag", "pstntag", "teams-call-1@sbc1.example.com", "1 INVITE", transport="TLS", extra=["Contact: <sip:sip.pstnhub.microsoft.com:5061;transport=tls>"])),
                    hop(1, 0, "200", "res", "200 OK answers the INVITE. Health of the trunk is a separate OPTIONS exchange.", msg_resp(200, "OK", "sbc1.example.com", "z9hG4bKteams01", "teamstag", "pstntag", "teams-call-1@sbc1.example.com", "1 INVITE", transport="TLS", extra=["Contact: <sip:sip.pstnhub.microsoft.com:5061;transport=tls>"], body=SRTP_SDP)),
                ]),
                quiz=[
                    quiz_item("Direct Routing signaling FQDNs include", ["sip.pstnhub.microsoft.com, sip2.pstnhub.microsoft.com, and sip3.pstnhub.microsoft.com", "Only an IP address", "sips origination URLs on Twilio", "A CUCM Lua script"], 0, "All three are documented.", "teams-sip"),
                    quiz_item("The signaling port is", ["5061", "5060 as the only documented port", "The RTP port", "443 in the SDP c= line"], 0, "TLS signaling uses 5061.", "teams-sip"),
                    quiz_item("TLS for Direct Routing is", ["TLS 1.2 or later", "Optional on UDP 5060", "SRTP in the Contact header", "RFC 5923 aliasing"], 0, "The protocol articles require TLS 1.2+.", "teams-rfc"),
                    quiz_item("A tenant domain for the trunk must be", ["A verified tenant domain", "Any name ending in onmicrosoft.com", "An IP address", "The Call-ID"], 0, "The plan document excludes the onmicrosoft.com domain.", "teams-plan"),
                    quiz_item("RFC 5923 connection aliasing on the Teams SIP proxy is", ["Not supported", "Required", "The same as early-offer forced", "A media codec"], 0, "The protocols article says the proxy does not support it.", "5923"),
                    quiz_item("An IP address in Contact produces", ["403", "A guaranteed 200 OK", "A datasheet CPS increase", "An AudioCodes Normalize"], 0, "The Contact must be an FQDN.", "teams-sip"),
                ],
                cards=[
                    card("pstnhub", "sip, sip2, and sip3.pstnhub.microsoft.com.", "teams-sip"),
                    card("5061", "Direct Routing signaling port.", "teams-sip"),
                    card("Verified domain", "Not a name ending in onmicrosoft.com.", "teams-plan"),
                    card("No RFC 5923", "The SIP proxy does not support connection aliasing.", "teams-rfc"),
                ],
                lab={"title": "Check Contact and the proxy host", "kind": "dissect", "prompt": "Dissect the Direct Routing INVITE. Which host is in Contact?",
                    "message": teams_inv,
                    "check": check("Contact uses", ["sbc1.example.com", "203.0.113.20", "198.51.100.30", "An onmicrosoft.com name"], 0, "The Request-URI host is sip.pstnhub.microsoft.com on port 5061.", "teams-sip")},
                fault={"title": "403 from an IP Contact", "symptom": "The proxy answers 403 Forbidden. The INVITE was sent to sip.pstnhub.microsoft.com on 5061 with Contact sip:sbc@203.0.113.20.",
                    "log": "SIP/2.0 403 Forbidden\nVia: SIP/2.0/TLS sbc1.example.com;branch=z9hG4bKteams01\nCSeq: 1 INVITE\nCall-ID: teams-call-1@sbc1.example.com\nContact was sip:sbc@203.0.113.20\n",
                    "choices": ["Contact is an IP, and the proxy requires an FQDN", "Port 5061 is undocumented", "A verified domain must end in onmicrosoft.com", "RFC 5923 aliasing is required before any INVITE"],
                    "answer": 0, "why": "The protocol article returns 403 when Contact is not an FQDN.", "cause": "The Contact host is 203.0.113.20.", "fix": "Set Contact to sip:sbc@sbc1.example.com. Use a verified tenant domain on the trunk, and do not rely on RFC 5923 connection aliasing.", "cites": cites("teams-sip", "teams-plan", "5923")},
            ),
            lesson(L, id="teams-options-media", title="OPTIONS health and SRTP media", minutes=15, tags=["teams", "options", "srtp"],
                summary="OPTIONS followed by 200 marks the SBC healthy. Media processors use SRTP. The protocol article’s OPTIONS CSeq cell disagrees with RFC 3261.",
                objectives=["Mark health with OPTIONS and 200", "Keep CSeq method equal to OPTIONS", "Treat media-processor audio as SRTP"],
                illustration={"type": "states", "title": "Health, then media", "caption": "Confirm CSeq with a capture. The table cell checked on 2026-10-14 is not the RFC.",
                    "nodes": ["Send OPTIONS", "Receive 200", "SBC healthy", "SRTP on processors"]},
                sections=[
                    sec("What marks the SBC healthy",
                        "Direct Routing uses OPTIONS, and a 200 OK marks the SBC healthy. The lab request is OPTIONS sip:sip.pstnhub.microsoft.com:5061 with CSeq: 1 OPTIONS and Contact sip:sbc@sbc1.example.com.",
                        "The SIP protocol article’s OPTIONS example table, checked on 2026-10-14, lists CSeq: 1 INVITE. That cell conflicts with RFC 3261, which requires the CSeq method to match OPTIONS. Teach the RFC, and confirm with a capture rather than copying that table cell.",
                        "teams-opts", "teams-sip", "3261-8"),
                    sec("Media processors",
                        "Media processors use SRTP. The synthetic offer uses RTP/SAVP and c=203.0.113.20 so the profile on the wire is SRTP, as RFC 3711 names it.",
                        "This lesson does not invent a media-bypass prerequisite list. If you need the media path for a specific tenant, capture the RTP profile and read the current media article instead of guessing from signaling alone.",
                        "3711", "teams-rfc"),
                ],
                flow=flow("Healthy OPTIONS, then a call", ["SBC", "Teams proxy"], [
                    hop(0, 1, "OPTIONS", "req", "CSeq method is OPTIONS. Do not copy a table cell that says INVITE.", teams_opt),
                    hop(1, 0, "200", "res", "200 OK marks the SBC healthy.", teams_ok),
                    hop(0, 1, "INVITE", "req", "The call is a later transaction. The offer profile is RTP/SAVP.", teams_inv),
                    hop(1, 0, "100", "res", "100 Trying is not the health signal. The OPTIONS 200 was.", msg_resp(100, "Trying", "sbc1.example.com", "z9hG4bKteams01", "teamstag", "", "teams-call-1@sbc1.example.com", "1 INVITE", transport="TLS")),
                ]),
                quiz=[
                    quiz_item("The SBC is marked healthy when", ["OPTIONS is answered with 200", "Any INVITE is retransmitted", "Contact is an IP", "CSeq says INVITE on an OPTIONS request"], 0, "That is the OPTIONS troubleshooting article.", "teams-opts"),
                    quiz_item("The CSeq method on OPTIONS must be", ["OPTIONS", "INVITE, because a table cell said so", "ACK", "REGISTER"], 0, "RFC 3261 wins over the conflicting table cell.", "3261-8"),
                    quiz_item("The OPTIONS example table cell checked on 2026-10-14", ["Lists CSeq: 1 INVITE and conflicts with RFC 3261", "Is the normative CSeq rule", "Defines SRTP", "Removes port 5061"], 0, "Confirm with a capture. Do not copy that cell.", "teams-sip"),
                    quiz_item("Media processors use", ["SRTP", "Unencrypted RTP only", "SIP INFO as the audio path", "RFC 5923 as the media protocol"], 0, "RTP/SAVP is the SDP profile used in the lab offer.", "3711"),
                    quiz_item("A capture is the check for CSeq because", ["The published table cell and the RFC disagree", "OPTIONS has no CSeq", "200 OK deletes CSeq", "The datasheet sets the method"], 0, "Believe the messages on the wire and RFC 3261.", "3261-20"),
                    quiz_item("100 Trying on the INVITE", ["Does not replace the OPTIONS 200 as the health signal", "Marks the SBC healthy by itself", "Carries SRTP keys in this lesson", "Is a TLS version"], 0, "Health is the OPTIONS transaction.", "teams-opts"),
                ],
                cards=[
                    card("OPTIONS 200", "Marks the Direct Routing SBC healthy.", "teams-opts"),
                    card("CSeq", "Method token matches the request. OPTIONS, not INVITE.", "3261-8"),
                    card("Table cell", "Checked 2026-10-14: CSeq: 1 INVITE. Do not copy it.", "teams-sip"),
                    card("SRTP", "Media processors use SRTP. RFC 3711.", "3711"),
                ],
                lab={"title": "Dissect a legal OPTIONS", "kind": "dissect", "prompt": "This is the request to send. What is the CSeq method?",
                    "message": teams_opt,
                    "check": check("CSeq on this OPTIONS is", ["1 OPTIONS", "1 INVITE", "1 ACK", "Missing"], 0, "The table cell that says INVITE is the one to reject.", "3261-8")},
                fault={"title": "Copied CSeq from the table", "symptom": "A keepalive was built by copying the protocol article’s OPTIONS example table. The peer does not treat the SBC as healthy.",
                    "log": bad_options,
                    "choices": ["CSeq method INVITE does not match OPTIONS", "Port 5061 must be omitted", "SRTP belongs in CSeq", "Contact FQDN causes this failure"],
                    "answer": 0, "why": "The request line is OPTIONS and the CSeq method is INVITE.", "cause": "The table cell checked on 2026-10-14 was copied.", "fix": "Send CSeq: 1 OPTIONS. Confirm the method in a capture. Keep the health decision tied to a 200 OK on that OPTIONS.", "cites": cites("3261-8", "teams-sip", "teams-opts")},
            ),
            lesson(L, id="webex-lgw", title="Webex Calling Local Gateway", minutes=15, tags=["webex", "local-gateway"],
                summary="An IOS XE Local Gateway uses SIP TLS and SRTP. Third-party SBCs use a certificate-based trunk. Wildcard certificates are not supported. ByoPSTN means bring your own PSTN.",
                objectives=["State the IOS XE TLS and SRTP requirement", "Use a certificate-based trunk for a third-party SBC", "Define ByoPSTN from the get-started article"],
                illustration={"type": "layers", "title": "Local Gateway path", "caption": "192.0.2.40 stands for the Webex peer. Real names are in the IOS XE article.",
                    "layers": [{"name": "Premises SBC", "detail": "CUBE or a third-party Local Gateway"}, {"name": "SIP TLS", "detail": "Signaling toward Webex"}, {"name": "SRTP", "detail": "Media, per the IOS XE article"}]},
                sections=[
                    sec("What the IOS XE article requires",
                        "The IOS XE local gateway article uses SIP TLS toward Webex and SRTP for media. The synthetic INVITE is TLS from 203.0.113.20, Contact sip:sbc@sbc1.example.com, and the offer is RTP/SAVP.",
                        "192.0.2.40 is only the lab stand-in for the Webex signaling peer. Take the real peer names from that article rather than from this page.",
                        "webex-ios", "3711"),
                    sec("Certificates and the name ByoPSTN",
                        "The trunks article says a third-party SBC is supported as a Local Gateway with a certificate-based trunk. The get-started article says wildcard certificates are not supported for Local Gateway.",
                        "ByoPSTN means bring your own PSTN in the preferred-architecture terminology cited from the get-started article. It is the premises path, and it is a different choice from Cloud Connected PSTN.",
                        "webex-trunks", "webex-lgw"),
                ],
                flow=flow("TLS and SRTP toward the Webex peer", ["Local Gateway", "Webex"], [
                    hop(0, 1, "INVITE", "req", "SIP TLS. SDP offers RTP/SAVP from 203.0.113.20.", webex_inv),
                    hop(1, 0, "100", "res", "The peer accepted the transaction.", msg_resp(100, "Trying", CUBE, "z9hG4bKwebex1", "wxgtag", "", "webex-lgw-1@example.com", "1 INVITE", transport="TLS")),
                    hop(1, 0, "200", "res", "The answer is SRTP from the lab peer address.", msg_resp(200, "OK", CUBE, "z9hG4bKwebex1", "wxgtag", "wxans", "webex-lgw-1@example.com", "1 INVITE", transport="TLS", extra=[f"Contact: <sip:webex@{CARRIER}>"], body=sdp_for(CARRIER, "webex", 30000, proto="RTP/SAVP", pts="0"))),
                    hop(0, 1, "ACK", "req", "ACK completes the early-offer dialog.", msg_ack(CUBE, CARRIER, "z9hG4bKwebexack", "wxgtag", "wxans", "webex-lgw-1@example.com", transport="TLS", contact_host="sbc1.example.com")),
                ]),
                quiz=[
                    quiz_item("The IOS XE Local Gateway article specifies", ["SIP TLS to Webex and SRTP for media", "UDP only and RTP/AVP only", "Wildcard certificates as mandatory", "Cloud Connected PSTN as the same object"], 0, "That is the webex-ios article.", "webex-ios"),
                    quiz_item("A third-party SBC as Local Gateway uses", ["A certificate-based trunk", "An invented Ribbon CLI", "SCCP", "An IP Contact required by Teams"], 0, "The trunks article documents that trunk.", "webex-trunks"),
                    quiz_item("Wildcard certificates for Local Gateway are", ["Not supported", "Required", "The Teams rule, copied here", "Defined by RFC 4733"], 0, "The get-started article says they are not supported.", "webex-lgw"),
                    quiz_item("ByoPSTN means", ["Bring your own PSTN", "Cloud Connected PSTN", "A Cisco Calling Plan seat", "Media bypass inside Teams"], 0, "Preferred-architecture terminology from the get-started article.", "webex-lgw"),
                    quiz_item("The lab offer profile is", ["RTP/SAVP", "RTP/AVP with no security profile", "A CSeq method", "An onmicrosoft.com name"], 0, "SRTP is the media requirement in the IOS XE article.", "3711"),
                    quiz_item("Cloud Connected PSTN and Local Gateway are", ["Different PSTN choices", "Two names for one trunk", "Both configured with voice class sip-profiles only", "The same wildcard rule"], 0, "Do not conflate them.", "webex-org"),
                ],
                cards=[
                    card("SIP TLS", "Signaling from an IOS XE Local Gateway to Webex.", "webex-ios"),
                    card("SRTP", "Media for that IOS XE Local Gateway.", "webex-ios"),
                    card("Certificate trunk", "How a third-party SBC is supported.", "webex-trunks"),
                    card("ByoPSTN", "Bring your own PSTN. Not Cloud Connected PSTN.", "webex-lgw"),
                ],
                lab={"title": "Read the Local Gateway offer", "kind": "sdp", "prompt": "The Local Gateway offer is SRTP. Which transport is in the m= line?",
                    "offer": SRTP_SDP, "answer": sdp_for(CARRIER, "webex", 30000, proto="RTP/SAVP", pts="0"),
                    "check": check("The offer m= protocol is", ["RTP/SAVP", "RTP/AVP", "UDP/TLS/RTP/SAVPF only", "SIP"], 0, "RTP/SAVP is the SRTP profile in this synthetic.", "3711")},
                fault={"title": "Wildcard certificate on a Local Gateway", "symptom": "The Local Gateway trunk fails certificate checks. The certificate uses a wildcard name that a Teams trunk on the same SBC accepted.",
                    "log": "INVITE sip:+15551212@192.0.2.40 SIP/2.0\nVia: SIP/2.0/TLS 203.0.113.20;branch=z9hG4bKwebex1\nContact: <sip:sbc@sbc1.example.com>\nCertificate CN: *.example.com\n",
                    "choices": ["Wildcard certificates are not supported for Local Gateway", "The IOS XE article requires RTP/AVP", "ByoPSTN means Cloud Connected PSTN", "Contact must be an IP address"],
                    "answer": 0, "why": "Teams wildcard support does not transfer to this trunk.", "cause": "The certificate CN is a wildcard.", "fix": "Install a certificate whose name matches the Local Gateway identity without a wildcard. Keep SIP TLS and SRTP, and use a certificate-based trunk if this SBC is third-party.", "cites": cites("webex-lgw", "webex-ios", "webex-trunks")},
            ),
            lesson(L, id="webex-pstn-models", title="Three PSTN choices, one per location", minutes=14, tags=["webex", "pstn"],
                summary="Webex Calling offers Cisco Calling Plan, Cloud Connected PSTN, or premises-based PSTN through a Local Gateway. A location has one PSTN connection.",
                objectives=["Name the three PSTN choices", "Give a location one connection", "Keep Cloud Connected PSTN distinct from Local Gateway"],
                illustration={"type": "table", "title": "PSTN choices", "caption": "Configure the location in the organization PSTN article.",
                    "columns": ["Choice", "Who provides the PSTN path"],
                    "rows": [["Cisco Calling Plan", "Cisco’s cloud calling plan"], ["Cloud Connected PSTN", "A cloud PSTN partner through Webex"], ["Premises-based PSTN", "Your Local Gateway"], ["Count per location", "One PSTN connection"]]},
                sections=[
                    sec("The three documented choices",
                        "The organization article lists Cisco Calling Plan, Cloud Connected PSTN, and premises-based PSTN through a Local Gateway. A location has one PSTN connection.",
                        "The ladder in this lesson is only the premises path: the Local Gateway at 203.0.113.20 sends the call to the carrier stand-in 192.0.2.40. That is ByoPSTN in the get-started article’s preferred-architecture language.",
                        "webex-org", "webex-lgw"),
                    sec("Do not merge the cloud partner with the gateway",
                        "Cloud Connected PSTN is a cloud PSTN partner connected through Webex. It is not your SBC, and it is not the Local Gateway trunk.",
                        "Choosing both for one location fights the one-connection rule. Pick the choice in the organization article, then follow the Local Gateway articles only when the choice is premises-based PSTN.",
                        "webex-org", "webex-trunks"),
                ],
                flow=flow("This ladder is premises-based PSTN only", ["Location", "Local Gateway", "Carrier"], [
                    hop(0, 1, "INVITE", "req", "The location’s call reaches the Local Gateway.", msg_invite(ALICE, CUBE, CID_A, BR_A, TAG_A)),
                    hop(1, 0, "100", "res", "The gateway accepts the caller dialog.", msg_resp(100, "Trying", ALICE, BR_A, TAG_A, "", CID_A, "1 INVITE")),
                    hop(1, 2, "INVITE", "req", "Premises PSTN leaves toward the carrier. This is not Cloud Connected PSTN.", lgw_pstn),
                    hop(2, 1, "180", "res", "The carrier alerts on the gateway’s outbound dialog.", msg_resp(180, "Ringing", CUBE, "z9hG4bKbyo01", "byotag", TAG_C, "byopstn-1@example.com", "1 INVITE", extra=[f"Contact: <sip:bob@{CARRIER}>"])),
                ]),
                quiz=[
                    quiz_item("The three PSTN choices are", ["Cisco Calling Plan, Cloud Connected PSTN, and premises-based PSTN via Local Gateway", "Only Local Gateway", "Only Teams Direct Routing", "BYOC Cloud and BYOC Premises"], 0, "They are listed in the organization article.", "webex-org"),
                    quiz_item("PSTN connections on one location", ["One", "Three at once", "Unlimited trunks of every type", "None, because Webex has no PSTN"], 0, "A location has one PSTN connection.", "webex-org"),
                    quiz_item("Cloud Connected PSTN is", ["A cloud PSTN partner through Webex", "Your Local Gateway", "A CUBE dial peer by definition", "Bring your own PSTN"], 0, "Keep it distinct from the premises gateway.", "webex-org"),
                    quiz_item("The ladder’s outbound INVITE represents", ["Premises-based PSTN", "Cisco Calling Plan provisioning", "A Teams OPTIONS probe", "SIPREC"], 0, "The Local Gateway is on the path.", "webex-lgw"),
                    quiz_item("ByoPSTN in the get-started terminology means", ["Bring your own PSTN", "Cloud Connected PSTN", "A wildcard certificate", "An onmicrosoft.com domain"], 0, "It is the preferred-architecture name, not the cloud-partner choice.", "webex-lgw"),
                    quiz_item("A design that attaches both Cloud Connected PSTN and a Local Gateway to one location", ["Breaks the one-connection rule", "Is required for SRTP", "Is the certificate-based trunk", "Is RFC 5923"], 0, "Pick one for that location.", "webex-org"),
                ],
                cards=[
                    card("Cisco Calling Plan", "One of the three organization-article choices.", "webex-org"),
                    card("Cloud Connected PSTN", "A cloud partner through Webex. Not the Local Gateway.", "webex-org"),
                    card("Local Gateway", "Premises-based PSTN. One connection on the location.", "webex-lgw"),
                    card("ByoPSTN", "Bring your own PSTN.", "webex-lgw"),
                ],
                lab={"title": "Name this ladder", "kind": "ladder", "prompt": "Step the call. Which PSTN model is on the wire here?",
                    "steps": ["Play the four hops.", "Find 203.0.113.20 and 192.0.2.40.", "Match the path to premises-based PSTN."],
                    "check": check("This synthetic path is", ["Premises-based PSTN via Local Gateway", "Cloud Connected PSTN", "Cisco Calling Plan with no gateway", "A Voice Connector bridge into Connect"], 0, "The Local Gateway is the premises hop.", "webex-org")},
                fault={"title": "Two PSTN connections on one location", "symptom": "Calls from one location sometimes leave through a cloud PSTN partner and sometimes through the Local Gateway. The design enabled both.",
                    "log": "Location: lab-location\nPSTN A: Cloud Connected PSTN\nPSTN B: Local Gateway 203.0.113.20\nINVITE sip:+15551212@192.0.2.40 SIP/2.0\n",
                    "choices": ["A location has one PSTN connection, and these two choices were combined", "RFC 3264 requires both", "Cloud Connected PSTN is the Local Gateway", "SRTP selects the partner automatically"],
                    "answer": 0, "why": "The organization article allows one connection for the location.", "cause": "Cloud Connected PSTN and premises-based PSTN were both attached.", "fix": "Choose one model for that location. Follow the Local Gateway articles only for the premises choice, and do not describe the cloud partner as a Local Gateway.", "cites": cites("webex-org", "webex-lgw")},
            ),
            lesson(L, id="connect-boundaries", title="Amazon Connect voice boundaries", minutes=15, tags=["connect", "siprec", "chime"],
                summary="Ordinary Connect calls use managed PSTN. SIPREC can feed a conversational analytics connector. A carrier bridged through Voice Connector is not the supported pattern.",
                objectives=["Use managed PSTN for ordinary calls", "Place SIPREC on the analytics connector", "Refuse the unapproved Voice Connector bridge"],
                illustration={"type": "layers", "title": "What is in bounds", "caption": "Voice Connector remains a SIP trunking service. It is not a shortcut into Connect.",
                    "layers": [{"name": "Managed PSTN", "detail": "Ordinary Connect voice"}, {"name": "SIPREC", "detail": "External system to the analytics connector"}, {"name": "Voice Connector", "detail": "Chime SDK SIP trunking, separate from that bridge"}]},
                sections=[
                    sec("Ordinary calls",
                        "Connect’s voice channel is managed PSTN. Ordinary calls do not require you to bring a SIP trunk.",
                        "The telephony document is the source for that channel. Do not add a carrier SIP trunk to the design just because a PBX deployment used one.",
                        "connect-tel"),
                    sec("SIPREC is not a call-control trunk",
                        "An external voice system can send SIPREC into a conversational analytics connector. RFC 7866 is the recording protocol and RFC 7865 is the metadata. In this synthetic, 203.0.113.20 sends the session toward 198.51.100.30, which stands for the connector.",
                        "The ladder uses one SDP so the lab stays on addresses we can show. A production SIPREC body is the multipart body in those RFCs and in the connector document. Chime SDK Voice Connector is a SIP trunking service. Bridging an external carrier into Connect through Voice Connector is not a supported pattern unless an AWS specialist reviews and approves it.",
                        "connect-ext", "connect-conn", "chime-vc", "chime-connect", "7866"),
                ],
                flow=flow("SIPREC toward the analytics connector", ["External voice", "Connector"], [
                    hop(0, 1, "INVITE", "req", "This synthetic shows the signaling relationship. A real SIPREC body is multipart.", siprec),
                    hop(1, 0, "100", "res", "The connector has the recording transaction.", msg_resp(100, "Trying", CUBE, "z9hG4bKsiprec1", "rectag", "", "siprec-1@example.com", "1 INVITE")),
                    hop(1, 0, "200", "res", "200 OK accepts the recording session in this lab.", msg_resp(200, "OK", CUBE, "z9hG4bKsiprec1", "rectag", "rectok", "siprec-1@example.com", "1 INVITE", extra=[f"Contact: <sip:connector@{CUCM}>"], body=sdp_for(CUCM, "connector", 32000))),
                    hop(0, 1, "ACK", "req", "ACK completes the recording dialog. This is not a carrier bridge into a contact flow.", msg_ack(CUBE, CUCM, "z9hG4bKsiprecack", "rectag", "rectok", "siprec-1@example.com")),
                ]),
                quiz=[
                    quiz_item("Ordinary Amazon Connect voice calls use", ["Managed PSTN", "A customer SIP trunk as a requirement", "Direct Routing", "A CUBE dial peer as the only path"], 0, "You do not bring a SIP trunk for ordinary calls.", "connect-tel"),
                    quiz_item("SIPREC into Connect is aimed at", ["A conversational analytics connector", "Replacing the managed PSTN for every call", "A Voice Connector carrier bridge", "CUCM Lua"], 0, "The connector document is the target.", "connect-conn"),
                    quiz_item("RFC 7866 describes", ["SIPREC recording sessions", "Teams OPTIONS", "Webex wildcard rules", "HMR reject codes"], 0, "RFC 7865 is the metadata companion.", "7866"),
                    quiz_item("Chime SDK Voice Connector is", ["A SIP trunking service", "The managed PSTN product name for ordinary Connect calls", "An AudioCodes IP group", "A Local Gateway"], 0, "That is the Voice Connector document.", "chime-vc"),
                    quiz_item("Bridging a carrier into Connect through Voice Connector is", ["Not a supported pattern unless an AWS specialist reviews and approves it", "The default how-to in this course", "Required for SIPREC", "The same as managed PSTN"], 0, "Do not teach or build that bridge as a standard design.", "chime-connect"),
                    quiz_item("The synthetic connector address is a stand-in at", ["198.51.100.30", "sip.pstnhub.microsoft.com", "An onmicrosoft.com domain", "Port 5061 on Teams"], 0, "Use the connector document for the real target.", "connect-conn"),
                ],
                cards=[
                    card("Managed PSTN", "Ordinary Connect calls. No customer SIP trunk required.", "connect-tel"),
                    card("SIPREC", "External voice into the analytics connector.", "connect-conn"),
                    card("Voice Connector", "Chime SDK SIP trunking service.", "chime-vc"),
                    card("Not a bridge", "Carrier through Voice Connector into Connect needs specialist approval.", "chime-connect"),
                ],
                lab={"title": "Name the recording relationship", "kind": "dissect", "prompt": "Dissect the synthetic SIPREC INVITE. Which address is the Request-URI host?",
                    "message": siprec,
                    "check": check("The Request-URI host is", ["198.51.100.30", "192.0.2.40", "sip.pstnhub.microsoft.com", "sbc1.example.com"], 0, "That stand-in is the connector, not a carrier bridge.", "connect-conn")},
                fault={"title": "A carrier bridge drawn as if it were supported", "symptom": "A diagram sends the carrier at 192.0.2.40 into Voice Connector and then into Connect contact flows. No specialist review is recorded.",
                    "log": "Design: 192.0.2.40 -> Voice Connector -> Amazon Connect\nINVITE sip:+15551212@203.0.113.20 SIP/2.0\nVia: SIP/2.0/UDP 192.0.2.40;branch=z9hG4bKbridge1\nCSeq: 1 INVITE\n",
                    "choices": ["That bridge is not a supported pattern unless an AWS specialist reviews and approves it", "The diagram is the ordinary managed-PSTN path", "SIPREC requires this bridge", "RFC 7866 defines Voice Connector as the contact flow"],
                    "answer": 0, "why": "Ordinary calls stay on managed PSTN.", "cause": "Voice Connector was used as an unapproved path from a carrier into Connect.", "fix": "Use managed PSTN for ordinary calls. Use the external-voice SIPREC path only toward the conversational analytics connector. Do not implement the carrier bridge unless an AWS specialist reviews and approves it.", "cites": cites("connect-tel", "chime-connect", "connect-conn")},
            ),
            lesson(L, id="five9-twilio", title="Five9 BYO SIP and Twilio trunks", minutes=16, tags=["five9", "twilio"],
                summary="Five9 BYO SIP connects your ITSP or gateway to Five9 SBCs. Twilio termination and origination are different directions, with a strict Request-URI rule.",
                objectives=["Define Five9 BYO SIP and the gateway option", "Separate Twilio termination from origination", "Keep origination URLs on the sip scheme"],
                illustration={"type": "table", "title": "Twilio directions", "caption": "Five9 is a different provider with its own BYO SIP document.",
                    "columns": ["Direction", "Meaning"],
                    "rows": [["Twilio termination", "Your infrastructure toward the PSTN"], ["Twilio origination", "PSTN calls toward your PBX"], ["Termination requirements", "Termination URI, plus IP ACL and/or credentials"], ["Origination URL", "sip scheme. sips is not supported"], ["Five9 BYO SIP", "Your ITSP or gateway connects to Five9 SBCs"]]},
                sections=[
                    sec("Five9",
                        "BYO SIP means the customer ITSP or gateway connects to Five9 SBCs. A gateway-to-gateway option is documented, and self-service exists for entitled BYO SIP trunk groups.",
                        "This lesson states no country limitation. In the synthetic, 203.0.113.20 is the customer gateway and 192.0.2.40 stands for a Five9 SBC. Use the BYO SIP document for the real peer addresses on an entitled trunk group.",
                        "five9"),
                    sec("Twilio termination and origination",
                        "Termination is your infrastructure toward the PSTN. It requires a termination URI plus an IP ACL and/or credentials. If the Request-URI does not reference the termination URI, Twilio treats the request as malicious and drops it.",
                        "Origination is PSTN calls toward your PBX via an origination SIP URI. The origination SIP URL schema is sip. The API reference says sips is not supported on origination URLs. In this lab the termination URI host is sbc1.example.com.",
                        "twilio", "twilio-ts", "twilio-api"),
                ],
                flow=flow("Request-URI matches the termination URI", ["PBX", "Twilio"], [
                    hop(0, 1, "INVITE", "req", "The Request-URI host is sbc1.example.com, the termination URI in this synthetic.", twilio_ok),
                    hop(1, 0, "100", "res", "The request was not dropped.", msg_resp(100, "Trying", CUBE, "z9hG4bKtwilio1", "twtag", "", "twilio-term-1@example.com", "1 INVITE")),
                    hop(1, 0, "180", "res", "Alerting on the termination attempt.", msg_resp(180, "Ringing", CUBE, "z9hG4bKtwilio1", "twtag", "twok", "twilio-term-1@example.com", "1 INVITE", extra=["Contact: <sip:sbc@sbc1.example.com>"])),
                    hop(1, 0, "200", "res", "200 OK is a completed termination setup in the lab.", msg_resp(200, "OK", CUBE, "z9hG4bKtwilio1", "twtag", "twok", "twilio-term-1@example.com", "1 INVITE", extra=["Contact: <sip:sbc@sbc1.example.com>"], body=ANCHOR_SDP)),
                ]),
                quiz=[
                    quiz_item("Five9 BYO SIP means", ["The customer ITSP or gateway connects to Five9 SBCs", "Twilio origination", "Managed Connect PSTN", "A Teams wildcard"], 0, "That is the BYO SIP trunk document.", "five9"),
                    quiz_item("Five9 also documents", ["A gateway-to-gateway option", "A country ban this course should state", "sips origination URLs", "HMR reject codes"], 0, "Self-service exists for entitled BYO SIP trunk groups.", "five9"),
                    quiz_item("Twilio termination requires", ["A termination URI plus an IP ACL and/or credentials", "Only an origination sips URL", "No Request-URI", "A CUCM MTP"], 0, "Termination is your side toward the PSTN.", "twilio"),
                    quiz_item("A Request-URI that does not reference the termination URI is", ["Treated as malicious and dropped", "Converted to OPTIONS", "The origination URL schema", "Answered with SDP automatically"], 0, "That is the troubleshooting document.", "twilio-ts"),
                    quiz_item("Origination SIP URL scheme", ["sip, and sips is not supported", "sips only", "An IP Contact required by Teams", "tel with no SIP"], 0, "The API reference says sips is not supported on origination URLs.", "twilio-api"),
                    quiz_item("Origination means", ["PSTN calls toward your PBX", "Your INVITE toward the PSTN", "SIPREC to Connect", "A Five9 country list"], 0, "It uses the origination SIP URI.", "twilio"),
                ],
                cards=[
                    card("BYO SIP", "Your ITSP or gateway connects to Five9 SBCs.", "five9"),
                    card("Entitled groups", "Self-service exists for entitled BYO SIP trunk groups.", "five9"),
                    card("Termination URI", "Must appear in the Request-URI or Twilio drops the request.", "twilio-ts"),
                    card("sip not sips", "Origination URLs use sip. sips is not supported.", "twilio-api"),
                ],
                lab={"title": "Read the termination Request-URI", "kind": "dissect", "prompt": "The termination URI host in this lab is sbc1.example.com. What host does this INVITE use?",
                    "message": twilio_ok,
                    "check": check("The Request-URI host is", ["sbc1.example.com", "192.0.2.40", "198.51.100.30", "sip.pstnhub.microsoft.com"], 0, "A different host would be dropped.", "twilio-ts")},
                fault={"title": "Request-URI missed the termination URI", "symptom": "Twilio drops the INVITE. The termination URI host is sbc1.example.com. The request targets 192.0.2.40.",
                    "log": "INVITE sip:+15551212@192.0.2.40 SIP/2.0\nVia: SIP/2.0/UDP 203.0.113.20;branch=z9hG4bKtwilio9\nFrom: \"Alice\" <sip:alice@example.com>;tag=twtag\nTo: <sip:+15551212@example.com>\nCall-ID: twilio-term-1@example.com\nCSeq: 1 INVITE\nContact: <sip:sbc@203.0.113.20>\nContent-Length: 0\n",
                    "choices": ["The Request-URI does not reference the termination URI, so Twilio drops it", "sips is required on origination and this is origination", "Five9 country rules blocked the call", "CSeq OPTIONS would fix a termination URI"],
                    "answer": 0, "why": "The troubleshooting document describes this drop.", "cause": "The Request-URI host is 192.0.2.40 instead of sbc1.example.com.", "fix": "Send INVITE sip:+15551212@sbc1.example.com with the termination URI you configured, and keep the IP ACL and/or credentials in place. Use a sip origination URL, not sips, when the call is coming toward your PBX.", "cites": cites("twilio-ts", "twilio", "twilio-api")},
            ),
            lesson(L, id="genesys-cxone", title="Genesys BYOC and NICE CXone SIP", minutes=16, tags=["genesys", "cxone", "byoc"],
                summary="BYOC Cloud and BYOC Premises can be combined. NICE CXone documents SIP trunks on 5060 and 5061 with dynamic RTP and SRTP. Confirm carrier details with NICE.",
                objectives=["Separate BYOC Cloud from BYOC Premises", "Keep the hardware date on the Genesys Hardware Solution", "State CXone ports without inventing a BYOC menu"],
                illustration={"type": "table", "title": "Two vendors, documented scopes", "caption": "December 1, 2026 applies to the Genesys Hardware Solution.",
                    "columns": ["Topic", "Documented fact"],
                    "rows": [["BYOC Cloud", "SIP over the public internet to the Genesys media tier"], ["BYOC Cloud media", "RTP crosses the internet. Far end needs a public address"], ["BYOC Premises", "Customer-managed Edge"], ["Hybrid", "Cloud and Premises can be combined"], ["Genesys Hardware Solution", "Support ends December 1, 2026"], ["CXone", "SIP trunks, ports 5060 and 5061, dynamic RTP/SRTP"]]},
                sections=[
                    sec("BYOC Cloud, Premises, and hybrid",
                        "BYOC Cloud is SIP over the public internet to the Genesys media tier. RTP crosses the internet, and the far end needs a public address. In this synthetic those roles are 203.0.113.20 and 192.0.2.40.",
                        "BYOC Premises is a customer-managed Edge. The two can be combined with hybrid media. The BYOC Premises article says Genesys Hardware Solution support ends December 1, 2026. That date is not a date for Customer Hardware.",
                        "genesys-cloud", "genesys-about", "genesys-prem", "genesys-hybrid"),
                    sec("NICE CXone, only what those two pages say",
                        "The CXone connectivity and port documents describe SIP trunks, ports 5060 and 5061, and dynamic RTP and SRTP. This lesson does not invent a BYOC menu.",
                        "Account-specific carrier connectivity must be confirmed with NICE. Do not copy a Genesys public-address rule or a port range from another vendor into a CXone design.",
                        "cxone", "cxone-ports"),
                ],
                flow=flow("BYOC Cloud signaling in the synthetic", ["Customer SBC", "Genesys media"], [
                    hop(0, 1, "INVITE", "req", "SIP crosses the public internet. 203.0.113.20 stands in for the customer’s public SBC.", genesys_inv),
                    hop(1, 0, "100", "res", "The media tier has the transaction.", msg_resp(100, "Trying", CUBE, "z9hG4bKbyoc01", "byoctag", "", "byoc-1@example.com", "1 INVITE")),
                    hop(1, 0, "200", "res", "The answer c= is 192.0.2.40. RTP will cross the internet to a public address.", msg_resp(200, "OK", CUBE, "z9hG4bKbyoc01", "byoctag", "genok", "byoc-1@example.com", "1 INVITE", extra=[f"Contact: <sip:media@{CARRIER}>"], body=CARRIER_SDP)),
                    hop(0, 1, "ACK", "req", "ACK completes the dialog. Premises Edges are a separate BYOC choice.", msg_ack(CUBE, CARRIER, "z9hG4bKbyocack", "byoctag", "genok", "byoc-1@example.com", contact_host="sbc1.example.com")),
                ]),
                quiz=[
                    quiz_item("BYOC Cloud signaling is", ["SIP over the public internet to the Genesys media tier", "A private Edge with no public address required", "Teams Direct Routing", "Twilio origination sips"], 0, "RTP also crosses the internet.", "genesys-cloud"),
                    quiz_item("The BYOC Cloud far end needs", ["A public address", "An onmicrosoft.com domain", "A wildcard forbidden by Teams", "No RTP"], 0, "The about article describes that public path.", "genesys-about"),
                    quiz_item("BYOC Premises is", ["A customer-managed Edge", "Always the Genesys Hardware Solution", "Cloud Connected PSTN", "A CXone BYOC menu"], 0, "It can be combined with BYOC Cloud as hybrid media.", "genesys-prem"),
                    quiz_item("December 1, 2026 is the end of support for", ["The Genesys Hardware Solution", "Customer Hardware", "All BYOC Cloud trunks", "NICE CXone SIP"], 0, "Do not extend the date to Customer Hardware.", "genesys-prem"),
                    quiz_item("CXone signaling ports in the port document include", ["5060 and 5061", "Only 5061 on pstnhub", "Only dynamic ports with no SIP port", "443 as the SIP port"], 0, "RTP and SRTP ports are dynamic.", "cxone-ports"),
                    quiz_item("CXone carrier connectivity is", ["Account-specific and confirmed with NICE", "A BYOC menu this lesson can name", "The same public-address rule as BYOC Cloud", "Optional because SIP trunks are undocumented"], 0, "The two CXone cites do not invent that menu.", "cxone"),
                ],
                cards=[
                    card("BYOC Cloud", "Public internet SIP. RTP crosses the internet.", "genesys-cloud"),
                    card("BYOC Premises", "Customer-managed Edge. Hybrid media is allowed.", "genesys-hybrid"),
                    card("December 1, 2026", "Genesys Hardware Solution only.", "genesys-prem"),
                    card("CXone ports", "5060 and 5061, plus dynamic RTP/SRTP.", "cxone-ports"),
                ],
                lab={"title": "Whose date is it?", "kind": "ladder", "prompt": "Play the BYOC Cloud ladder, then answer from the Premises article rather than from the SIP itself.",
                    "steps": ["Play the four hops.", "Notice RTP addresses are public stand-ins.", "Apply the hardware date only where the article puts it."],
                    "check": check("December 1, 2026 ends support for", ["The Genesys Hardware Solution", "Customer Hardware", "Every CXone tenant", "Twilio origination URLs"], 0, "The Premises article names the Genesys Hardware Solution.", "genesys-prem")},
                fault={"title": "The hardware date applied too widely", "symptom": "A maintenance plan decommissions Customer Hardware Edges on December 1, 2026 because that date appears in the BYOC Premises article.",
                    "log": "Note: decommission Customer Hardware on December 1, 2026\nOPTIONS sip:sbc1.example.com SIP/2.0\nVia: SIP/2.0/UDP 203.0.113.20;branch=z9hG4bKedge01\nCSeq: 1 OPTIONS\nCall-ID: edge-1@example.com\nSIP/2.0 200 OK\nCSeq: 1 OPTIONS\n",
                    "choices": ["The date covers the Genesys Hardware Solution, not Customer Hardware", "The 200 OK means the date applies to every Edge", "BYOC Cloud forbids a public address", "CXone uses this date as a BYOC menu"],
                    "answer": 0, "why": "The article names one hardware program.", "cause": "The Genesys Hardware Solution date was copied onto Customer Hardware.", "fix": "Leave Customer Hardware on the support terms in the current BYOC Premises article. Keep December 1, 2026 on the Genesys Hardware Solution. Confirm CXone carrier connectivity with NICE separately.", "cites": cites("genesys-prem", "genesys-hybrid", "cxone")},
            ),
        ],
    }


def tracks():
    return [track_sbc(), track_cisco(), track_multivendor(), track_cloud()]
