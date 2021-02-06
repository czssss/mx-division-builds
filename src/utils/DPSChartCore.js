import {
    BehaviorSubject,
    combineLatest,
    timer
} from 'rxjs';
import {
    debounce
} from "rxjs/operators";
import StatsService from "./statsService";
class DPSChartCoreService {

    _subjects = {
        Primary: new BehaviorSubject(),
        Secondary: new BehaviorSubject(),
        SideArm: new BehaviorSubject(),
    }

    saveCurrentStatsForComparison() { }

    addCoreWeaponTrace(slot, weaponStats) {
        let timeToEmptyMagazine = (weaponStats.totalMagSize / (weaponStats.rpm / 60)) * 1000;
        const dataPointsCount = Math.round(60000 / (timeToEmptyMagazine + weaponStats.reloadSpeed));
        const dataPointsToRenderCount = dataPointsCount + 1;
        let damageDelta = 0
        let timeDelta = 0
        const timeAxis = new Array(dataPointsToRenderCount);
        const damageAxis = new Array(dataPointsToRenderCount);
        timeAxis[0] = 0;
        damageAxis[0] = 0;
        for (let i = 1; i < dataPointsToRenderCount; i++) {
            const isReloadingTime = !(i % 2); // not (i % 2) becuse the first iteration is always not reloading 
            let damage = !isReloadingTime ? Number(weaponStats.dmgToOutOfCoverArmoredPerMag) + damageDelta : damageDelta;
            let time = isReloadingTime ? timeDelta + weaponStats.reloadSpeed : timeDelta + timeToEmptyMagazine;
            timeAxis[i] = time / 1000;
            damageAxis[i] = this.roundValue(damage);
            timeDelta = time;
            damageDelta = damage;
        }

        this._subjects[slot].next({
            name: `${slot}: ${weaponStats.weaponName}`,
            x: timeAxis,
            y: damageAxis
        })
    }

    // I know I know it's duplicated code
    // I will make it common soon(TM)
    roundValue(number) {
        return Number(Number(number).toFixed(2));
    }

    subscribeToCoreWeaponsTrace() {
        return combineLatest([
            this._subjects.Primary,
            this._subjects.Secondary,
            this._subjects.SideArm
        ]).pipe(debounce(() => timer(300)));
    }

    applyCHCandHSDtoTheCoreTraces(chc, hsd) {
        ['Primary', 'Secondary', 'SideArm'].forEach((slot) => {
            const weaponStat = StatsService.getWeaponStatsPerSlot(slot, chc, hsd);
            this.addCoreWeaponTrace(slot, weaponStat);
        })
    }
}

const DPSChartCoreServiceInst = new DPSChartCoreService();

export default DPSChartCoreServiceInst;