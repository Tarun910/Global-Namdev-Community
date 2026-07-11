/** Visible captcha slot on the mobile step — widget script targets #msg91-captcha */
export default function Msg91CaptchaMount() {
  return (
    <div className="space-y-2 w-full">
      <p className="text-[10px] text-slate-500 text-center leading-relaxed">
        If a captcha appears below, complete it before sending OTP.
      </p>
      <div
        id="msg91-captcha"
        className="flex justify-center min-h-[78px] w-full"
        aria-label="Captcha verification"
      />
    </div>
  );
}
