import 'dart:async';

import 'package:efashion_flutter/presentation/shared/animations/custom_fade_animation.dart';
import 'package:efashion_flutter/shared/util/strings_manager.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

class OtpTimer extends StatefulWidget {
  final void Function() onResendPress;
  const OtpTimer({super.key, required this.onResendPress});

  @override
  State<OtpTimer> createState() => _OtpTimerState();
}

class _OtpTimerState extends State<OtpTimer> {
  final _interval = const Duration(seconds: 1);
  final int _timerMaxSeconds = 60;
  final ValueNotifier<int> _currentSeconds = ValueNotifier(0);
  Timer? _timer;

  String get timerText =>
      '${((_timerMaxSeconds - _currentSeconds.value) ~/ 60).toString().padLeft(2, '0')}: ${((_timerMaxSeconds - _currentSeconds.value) % 60).toString().padLeft(2, '0')}';

  void startTimeout([int? milliseconds]) {
    _timer?.cancel();
    _currentSeconds.value = 0;
    _timer = Timer.periodic(_interval, (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      _currentSeconds.value = timer.tick;
      if (timer.tick >= _timerMaxSeconds) {
        timer.cancel();
        _currentSeconds.value = -1;
      }
    });
  }

  @override
  void initState() {
    startTimeout();
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        ValueListenableBuilder(
          valueListenable: _currentSeconds,
          builder: (context, currentSecondsValue, child) => Visibility(
            visible: currentSecondsValue >= 0,
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  StringsManager.resendOtpIn,
                  style: Theme.of(context).textTheme.labelLarge!.copyWith(
                        color: Theme.of(context).colorScheme.outline,
                      ),
                ),
                SizedBox(
                  width: 5.w,
                ),
                Text(
                  timerText,
                  style: Theme.of(context).textTheme.labelLarge!.copyWith(
                        color: Theme.of(context).colorScheme.outline,
                      ),
                )
              ],
            ),
          ),
        ),
        ValueListenableBuilder(
          valueListenable: _currentSeconds,
          builder: (context, currentSecondsValue, child) => Visibility(
            visible: currentSecondsValue == -1,
            child: CustomFadeAnimation(
              duration: const Duration(milliseconds: 250),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    StringsManager.noOtpCode,
                    style: Theme.of(context).textTheme.labelLarge!.copyWith(
                          color: Theme.of(context).colorScheme.outline,
                        ),
                  ),
                  TextButton(
                    onPressed: () {
                      startTimeout();
                      widget.onResendPress();
                    },
                    child: Text(
                      StringsManager.resendOtp,
                      style: Theme.of(context).textTheme.labelLarge!.copyWith(
                            color: Theme.of(context).colorScheme.primary,
                          ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  @override
  void dispose() {
    _timer?.cancel();
    _currentSeconds.dispose();
    super.dispose();
  }
}
